from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class BoundingBox:
    """Toạ độ pixel trên ảnh trang web đầu vào (gốc top-left)."""

    x_min: float
    y_min: float
    x_max: float
    y_max: float

    def to_dict(self) -> dict:
        return {
            "x_min": round(self.x_min, 2),
            "y_min": round(self.y_min, 2),
            "x_max": round(self.x_max, 2),
            "y_max": round(self.y_max, 2),
        }


@dataclass(frozen=True)
class Detection:
    """1 vị trí trên ảnh trang web được nhận diện là khớp với 1 component thật.

    variant: YOLO chỉ nhận diện LOẠI component, không phân biệt style/preset -> luôn là None.
    Giữ lại field này để tương thích format response cũ.
    """

    group: str
    component: str
    confidence: float
    box: BoundingBox
    variant: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "group": self.group,
            "component": self.component,
            "variant": self.variant,
            "confidence": round(self.confidence, 4),
            "box": self.box.to_dict(),
        }
