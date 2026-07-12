"""
Sinh ảnh "trang web giả" bằng cách xếp CHỒNG DỌC (đúng cách 1 trang e-commerce thật được ghép từ
nhiều section — full-width, xếp từ trên xuống, không chồng lấn) nhiều ảnh section thật đã chụp
khít (xem gen_fe_module/preview-app/scripts/capture-crops.mts, chụp component thật từ
@ecommerce/ui-registry) — dùng cho 2 việc:

  1. Sinh dữ liệu train YOLO hàng loạt (xem ../yolo_dataset/build_dataset.py).
  2. Sinh ảnh "test có giám sát" theo yêu cầu qua server.py (GET /sample-test) — vì biết trước
     chính xác vị trí/loại từng section đã ghép vào, có thể tính độ chính xác thật của model (so
     với ảnh chụp trang web thật, không có ground-truth để đối chiếu) — xem scoring.py.
"""
from __future__ import annotations

import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image

YOLO_DATASET_DIR = Path(__file__).resolve().parent.parent / "yolo_dataset"
DEFAULT_MANIFEST_PATH = YOLO_DATASET_DIR / "manifest.json"
DEFAULT_HARD_CROPS_DIR = YOLO_DATASET_DIR / "hard_crops"

BG_COLORS = [
    (255, 255, 255), (250, 250, 250), (245, 245, 247), (240, 242, 245),
    (255, 251, 245), (247, 250, 255), (30, 32, 38), (18, 18, 22),
]


@dataclass(frozen=True)
class GroundTruthInstance:
    """1 section đã được ghép vào ảnh test — biết trước chính xác vị trí/loại."""

    group: str
    component: str
    box: tuple[float, float, float, float]  # x_min, y_min, x_max, y_max (pixel)

    def to_dict(self) -> dict:
        x_min, y_min, x_max, y_max = self.box
        return {
            "group": self.group,
            "component": self.component,
            "box": {"x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max},
        }


def load_hard_crops(hard_crops_dir: Path = DEFAULT_HARD_CROPS_DIR) -> dict[str, list[Path]]:
    """componentId -> danh sách ảnh crop THẬT (lấy từ ảnh trang web thật, do người dùng cung cấp
    rồi được phân loại/crop thủ công — xem yolo_dataset/README.md mục "Bổ sung dữ liệu train từ
    trường hợp thật"), đọc trực tiếp từ cấu trúc thư mục hard_crops/<componentId>/*.png (không cần
    manifest — khác raw_crops/ vốn do capture-crops.mts tự sinh kèm manifest.json).
    """
    by_class: dict[str, list[Path]] = {}
    if not hard_crops_dir.is_dir():
        return by_class
    for class_dir in hard_crops_dir.iterdir():
        if not class_dir.is_dir():
            continue
        images = sorted(p for p in class_dir.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg"))
        if images:
            by_class[class_dir.name] = images
    return by_class


def load_manifest(
    manifest_path: Path = DEFAULT_MANIFEST_PATH,
    hard_crops_dir: Path = DEFAULT_HARD_CROPS_DIR,
) -> tuple[dict[str, list[Path]], dict[str, str]]:
    """componentId -> danh sách đường dẫn ảnh crop, + componentId -> type ("section"/"block").

    Gộp 2 nguồn: manifest.json (crop tổng hợp do capture-crops.mts sinh, xem module docstring) và
    hard_crops/ (crop THẬT bổ sung thủ công từ ảnh trang web thật — xem load_hard_crops()). Cả 2
    nguồn dùng chung 1 pool khi ghép ảnh train -> component có mặt trong cả 2 sẽ được chọn ngẫu
    nhiên từ toàn bộ ảnh gộp (không ưu tiên nguồn nào).
    """
    by_class: dict[str, list[Path]] = {}
    class_types: dict[str, str] = {}

    if manifest_path.is_file():
        with open(manifest_path, encoding="utf-8") as f:
            entries = json.load(f)
        gen_fe_module_dir = manifest_path.resolve().parent.parent
        for entry in entries:
            p = gen_fe_module_dir / entry["path"]
            if p.is_file():
                by_class.setdefault(entry["componentId"], []).append(p)
                class_types[entry["componentId"]] = entry.get("type", "section")

    for component_id, paths in load_hard_crops(hard_crops_dir).items():
        by_class.setdefault(component_id, []).extend(paths)
        class_types.setdefault(component_id, "section")

    return by_class, class_types


def build_synthetic_image(
    by_class: Optional[dict[str, list[Path]]] = None,
    class_types: Optional[dict[str, str]] = None,
    rng: Optional[random.Random] = None,
    min_instances: int = 3,
    max_instances: int = 7,
) -> tuple[Image.Image, list[GroundTruthInstance]]:
    """Xếp chồng dọc `min_instances`..`max_instances` ảnh section (full-width, không chồng lấn —
    đúng bố cục 1 trang thật) lên 1 canvas. Trả về ảnh + ground truth (loại + vị trí chính xác
    từng section đã ghép) — dùng để tính độ chính xác thật khi so với kết quả model đoán (xem
    scoring.py).
    """
    if by_class is None:
        by_class, class_types = load_manifest()
    if class_types is None:
        class_types = {}
    if not by_class:
        raise ValueError(
            f"Không có ảnh section mẫu nào ({DEFAULT_MANIFEST_PATH}) — hãy chạy "
            "gen_fe_module/preview-app/scripts/capture-crops.mts trước (xem yolo_dataset/README.md)."
        )
    rng = rng or random.Random()
    class_names = sorted(by_class.keys())

    n_instances = rng.randint(min_instances, max_instances)
    loaded: list[tuple[str, Image.Image]] = []
    for _ in range(n_instances):
        class_name = rng.choice(class_names)
        crop_path = rng.choice(by_class[class_name])
        try:
            img = Image.open(crop_path).convert("RGB")
        except Exception:
            continue
        loaded.append((class_name, img))

    if not loaded:
        raise ValueError("Không load được ảnh crop nào cho ảnh test này — thử lại.")

    canvas_w = max(img.width for _, img in loaded)
    gap = rng.randint(0, 12)
    total_h = sum(img.height for _, img in loaded) + gap * (len(loaded) - 1)

    canvas = Image.new("RGB", (canvas_w, total_h), rng.choice(BG_COLORS))
    ground_truth: list[GroundTruthInstance] = []

    y = 0
    for class_name, img in loaded:
        x = (canvas_w - img.width) // 2  # ảnh hẹp hơn canvas (hiếm) -> căn giữa thay vì lệch trái
        canvas.paste(img, (x, y))
        box = (float(x), float(y), float(x + img.width), float(y + img.height))
        ground_truth.append(
            GroundTruthInstance(group=class_types.get(class_name, "section"), component=class_name, box=box)
        )
        y += img.height + gap

    return canvas, ground_truth
