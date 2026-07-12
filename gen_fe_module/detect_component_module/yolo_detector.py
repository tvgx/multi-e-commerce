"""
Nhận diện component UI THẬT (section trong @ecommerce/ui-registry — Hero, Header, FeaturedProducts,
Footer...) bằng model YOLO fine-tune trên dữ liệu ảo: chụp khít từng component thật qua
gen_fe_module/preview-app (render với props ngẫu nhiên — text/màu/ảnh đổi mỗi lần chụp để model
học đặc trưng thị giác chứ không học thuộc props cụ thể), rồi xếp chồng dọc nhiều section lên
canvas giả lập 1 trang web thật (xem detect_component_module/synth.py).

componentId model trả về LÀ đúng tên component thật trong packages/ui-registry — không qua bước
ánh xạ nào — nên detections_to_layout() (layout_export.py) xuất JSON dùng thẳng được cho
builder/storefront thật.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional, Sequence

from PIL import Image

from .types import BoundingBox, Detection

DEFAULT_WEIGHTS_PATH = (
    Path(__file__).resolve().parent.parent / "yolo_dataset" / "runs" / "gfm_component_yolo" / "weights" / "best.pt"
)


class YoloComponentDetector:
    """Bọc quanh model YOLO đã fine-tune — load 1 lần, tái sử dụng cho nhiều lượt detect()."""

    def __init__(self, weights_path: Path | str = DEFAULT_WEIGHTS_PATH, device: Optional[str] = None) -> None:
        import torch
        from ultralytics import YOLO

        self.weights_path = Path(weights_path)
        if not self.weights_path.is_file():
            raise FileNotFoundError(
                f"Không tìm thấy weights YOLO tại {self.weights_path} — hãy chạy "
                "gen_fe_module/app/gen-yolo-crops.cjs -> gen_fe_module/yolo_dataset/build_dataset.py "
                "-> gen_fe_module/yolo_dataset/train_yolo.py trước (xem yolo_dataset/README.md)."
            )
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = YOLO(str(self.weights_path))
        # model.names: {0: "Hero", 1: "Header", ...} — đúng componentId thật trong ui-registry,
        # xem gen_fe_module/preview-app/scripts/capture-crops.mts.
        self.class_names: dict[int, str] = self.model.names

    def detect(
        self,
        image: Image.Image,
        groups: Optional[Sequence[str]] = None,
        confidence_threshold: float = 0.25,
        nms_iou_threshold: float = 0.45,
    ) -> list[Detection]:
        """So khớp `image` (ảnh trang web) với model YOLO đã fine-tune.

        groups: chỉ giữ lại phát hiện thuộc các nhóm này (vd ["section"]); None = giữ hết. Hiện tại
            MỌI class đều group="section" (chỉ train trên component type section — xem synth.py),
            tham số này chủ yếu để tương thích API nếu sau này có thêm group khác.
        confidence_threshold: ngưỡng điểm tin cậy tối thiểu (YOLO đã tự hiệu chỉnh điểm số qua
            quá trình train, nên ngưỡng hợp lý thường thấp hơn nhiều so với OWLv2, vd 0.25-0.5).
        nms_iou_threshold: ngưỡng IoU để YOLO tự gộp các box trùng nhau (Non-Max Suppression).
        """
        image = image.convert("RGB")
        results = self.model.predict(
            source=image,
            conf=confidence_threshold,
            iou=nms_iou_threshold,
            device=self.device,
            verbose=False,
        )

        wanted_groups = set(groups) if groups else None
        detections: list[Detection] = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls.item())
                component_id = self.class_names[class_id]
                group = "section"
                if wanted_groups and group not in wanted_groups:
                    continue
                x_min, y_min, x_max, y_max = (float(v) for v in box.xyxy[0].tolist())
                detections.append(
                    Detection(
                        group=group,
                        component=component_id,
                        confidence=float(box.conf.item()),
                        box=BoundingBox(x_min, y_min, x_max, y_max),
                    )
                )

        detections.sort(key=lambda d: d.confidence, reverse=True)
        return detections
