"""
Thêm 1 crop THẬT (cắt từ ảnh trang web thật) vào tập train YOLO của detect_component_module —
dùng cho các trường hợp YOLO không detect được vì component thật trên trang khác quá nhiều so với
ảnh tổng hợp lúc train (ảnh/link/style thật khác với props ngẫu nhiên sinh ra khi train).

Nguồn có thể là ảnh raster (PNG/JPG) HOẶC file SVG (bất kể đuôi file — vd export từ Figma lưu
nhầm thành .txt, xem tools/svg_to_png.py) — tự nhận diện và render SVG thành raster trước khi crop,
không cần convert thủ công bằng svg_to_png.py trước. Toạ độ box tính theo đúng width/height khai
báo trong thẻ <svg> (thường trùng viewBox).

Lưu vào gen_fe_module/yolo_dataset/hard_crops/<component_id>/<NNN>.png — build_dataset.py (qua
detect_component_module/synth.py) tự gộp thư mục này vào pool khi ghép ảnh train, không cần bước
thủ công nào khác ngoài chạy lại build_dataset.py + train_yolo.py sau khi thêm đủ.

Dùng:
    python add_hard_crop.py <ảnh_gốc_hoặc_svg> <component_id> <x_min> <y_min> <x_max> <y_max>
    python add_hard_crop.py --list                      # xem số lượng hard crop hiện có mỗi class
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

from svg_to_png import is_svg_file, render_svg_to_image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252, không encode được tiếng Việt
    sys.stderr.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
YOLO_DATASET_DIR = HERE.parent / "yolo_dataset"
HARD_CROPS_DIR = YOLO_DATASET_DIR / "hard_crops"
MANIFEST_PATH = YOLO_DATASET_DIR / "manifest.json"


def known_component_ids() -> set[str]:
    """Danh sách componentId đã biết (từ manifest.json, do capture-crops.mts sinh ra) — chỉ để
    cảnh báo gõ sai tên, KHÔNG chặn cứng (hard_crops có thể thêm componentId mới nếu cần)."""
    if not MANIFEST_PATH.is_file():
        return set()
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        entries = json.load(f)
    return {e["componentId"] for e in entries}


def add_crop(image_path: Path, component_id: str, box: tuple[int, int, int, int]) -> Path:
    if not image_path.is_file():
        raise SystemExit(f"Không tìm thấy ảnh: {image_path}")

    known = known_component_ids()
    if known and component_id not in known:
        print(f"CẢNH BÁO: '{component_id}' không có trong danh sách component đã biết ({len(known)} class) — kiểm tra lại chính tả nếu không cố ý thêm class mới.", file=sys.stderr)

    x_min, y_min, x_max, y_max = box
    if x_max <= x_min or y_max <= y_min:
        raise SystemExit(f"Box không hợp lệ: ({x_min},{y_min})-({x_max},{y_max})")

    if is_svg_file(image_path):
        img = render_svg_to_image(image_path)
    else:
        img = Image.open(image_path).convert("RGB")
    crop = img.crop((x_min, y_min, x_max, y_max))

    class_dir = HARD_CROPS_DIR / component_id
    class_dir.mkdir(parents=True, exist_ok=True)
    existing = sorted(class_dir.glob("*.png"))
    next_index = len(existing)
    out_path = class_dir / f"{next_index:03d}.png"
    crop.save(out_path)
    return out_path


def list_counts() -> None:
    if not HARD_CROPS_DIR.is_dir():
        print("Chưa có hard_crops nào.")
        return
    total = 0
    for class_dir in sorted(HARD_CROPS_DIR.iterdir()):
        if not class_dir.is_dir():
            continue
        n = len(list(class_dir.glob("*.png")))
        total += n
        print(f"{class_dir.name}: {n}")
    print(f"Tổng: {total} ảnh hard crop")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("image", nargs="?", help="Đường dẫn ảnh gốc (chụp trang web thật)")
    parser.add_argument("component_id", nargs="?", help="Tên component thật (vd Hero, Header, FeaturedProducts)")
    parser.add_argument("x_min", nargs="?", type=int)
    parser.add_argument("y_min", nargs="?", type=int)
    parser.add_argument("x_max", nargs="?", type=int)
    parser.add_argument("y_max", nargs="?", type=int)
    parser.add_argument("--list", action="store_true", help="Xem số lượng hard crop hiện có mỗi class")
    args = parser.parse_args()

    if args.list:
        list_counts()
        return

    if not all([args.image, args.component_id]) or None in (args.x_min, args.y_min, args.x_max, args.y_max):
        parser.error("cần đủ: <ảnh_gốc> <component_id> <x_min> <y_min> <x_max> <y_max> (hoặc --list)")

    out_path = add_crop(Path(args.image), args.component_id, (args.x_min, args.y_min, args.x_max, args.y_max))
    print(f"Đã lưu: {out_path}")


if __name__ == "__main__":
    main()
