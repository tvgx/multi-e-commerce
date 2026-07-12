"""
So khớp box model đoán được với ground truth (biết trước chính xác — xem synth.py) để tính độ
chính xác thật của model. Chỉ áp dụng được cho ảnh "test có giám sát" (GET /sample-test trong
server.py) — ảnh chụp trang web thật (upload/nhập URL) không có ground truth để đối chiếu.
"""
from __future__ import annotations

from dataclasses import dataclass

from .synth import GroundTruthInstance
from .types import Detection


def _iou(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> float:
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    ix0, iy0 = max(ax0, bx0), max(ay0, by0)
    ix1, iy1 = min(ax1, bx1), min(ay1, by1)
    iw, ih = max(0.0, ix1 - ix0), max(0.0, iy1 - iy0)
    inter = iw * ih
    if inter <= 0:
        return 0.0
    area_a = (ax1 - ax0) * (ay1 - ay0)
    area_b = (bx1 - bx0) * (by1 - by0)
    return inter / (area_a + area_b - inter)


@dataclass(frozen=True)
class ScoreResult:
    true_positives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1: float

    def to_dict(self) -> dict:
        return {
            "true_positives": self.true_positives,
            "false_positives": self.false_positives,
            "false_negatives": self.false_negatives,
            "precision": round(self.precision, 4),
            "recall": round(self.recall, 4),
            "f1": round(self.f1, 4),
        }


def score_detections(
    ground_truth: list[GroundTruthInstance],
    detections: list[Detection],
    iou_threshold: float = 0.5,
) -> ScoreResult:
    """Khớp greedy theo confidence giảm dần: 1 detection được tính ĐÚNG (true positive) nếu cùng
    group+component với 1 ground-truth CHƯA bị khớp và IoU >= iou_threshold. Mỗi ground-truth chỉ
    khớp được với tối đa 1 detection (tránh 1 vùng thật bị đếm trùng nhiều lần bởi nhiều box).
    """
    matched_gt: set[int] = set()
    detections_sorted = sorted(detections, key=lambda d: d.confidence, reverse=True)

    true_positives = 0
    for det in detections_sorted:
        best_idx: int | None = None
        best_iou = 0.0
        for i, gt in enumerate(ground_truth):
            if i in matched_gt or gt.group != det.group or gt.component != det.component:
                continue
            det_box = (det.box.x_min, det.box.y_min, det.box.x_max, det.box.y_max)
            iou_val = _iou(gt.box, det_box)
            if iou_val >= iou_threshold and iou_val > best_iou:
                best_iou = iou_val
                best_idx = i
        if best_idx is not None:
            matched_gt.add(best_idx)
            true_positives += 1

    false_positives = len(detections) - true_positives
    false_negatives = len(ground_truth) - true_positives
    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    return ScoreResult(
        true_positives=true_positives,
        false_positives=false_positives,
        false_negatives=false_negatives,
        precision=precision,
        recall=recall,
        f1=f1,
    )
