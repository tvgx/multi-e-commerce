"""
Tự động khoanh vùng NGHI NGỜ bị YOLO bỏ sót trên 1 ảnh/SVG trang web thật — dùng để tăng tốc quy
trình bổ sung hard_crops (xem yolo_dataset/README.md): thay vì tự đoán toạ độ x_min/y_min/x_max/
y_max bằng mắt, script này chạy model hiện có, gộp các vùng ĐÃ detect theo trục dọc (đúng giả định
section luôn full-width, xếp chồng — xem detect_component_module/synth.py), rồi trả về phần CÒN
LẠI làm vùng ứng viên (kèm crop sẵn để xem nhanh) — chỉ còn việc gán đúng componentId (nhìn ảnh/
HTML, xem tools/fetch_url_debug.py) rồi thêm bằng add_hard_crop.py với đúng toạ độ script đã in ra.

LƯU Ý: KHÔNG tự phân loại được componentId (không có tín hiệu tên lớp đáng tin cậy trong SVG xuất
từ Figma lẫn ảnh raster) — chỉ khoanh vùng, việc gán nhãn vẫn cần xem trực quan.

Dùng:
    python find_gaps.py <ảnh_hoặc_svg> [--confidence-threshold 0.25] [--min-gap-height 60]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252, không encode được tiếng Việt

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))  # để import được detect_component_module (nằm ngoài tools/)

from svg_to_png import is_svg_file, render_svg_to_image  # noqa: E402


def load_image(path: Path):
    from PIL import Image

    if is_svg_file(path):
        return render_svg_to_image(path)
    return Image.open(path).convert("RGB")


def merge_intervals(intervals: list[tuple[float, float]]) -> list[tuple[float, float]]:
    if not intervals:
        return []
    intervals = sorted(intervals)
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))
    return merged


def find_gaps(image, detections, min_gap_height: float, min_coverage_width_ratio: float = 0.6):
    """Trả về list các khoảng (y_min, y_max) KHÔNG được detection nào (đủ rộng) phủ tới."""
    width = image.width
    covered = [
        (d.box.y_min, d.box.y_max)
        for d in detections
        if (d.box.x_max - d.box.x_min) >= width * min_coverage_width_ratio
    ]
    covered = merge_intervals(covered)

    gaps: list[tuple[float, float]] = []
    cursor = 0.0
    for y_min, y_max in covered:
        if y_min - cursor >= min_gap_height:
            gaps.append((cursor, y_min))
        cursor = max(cursor, y_max)
    if image.height - cursor >= min_gap_height:
        gaps.append((cursor, float(image.height)))
    return gaps


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("image", help="Đường dẫn ảnh hoặc file SVG (trang web thật)")
    parser.add_argument("--confidence-threshold", type=float, default=0.25)
    parser.add_argument("--min-gap-height", type=float, default=60, help="Bỏ qua khoảng trống nhỏ hơn (padding tự nhiên giữa section)")
    parser.add_argument("--out-dir", default=None, help="Thư mục lưu crop từng vùng nghi ngờ (mặc định: tools/review/<tên file>/)")
    args = parser.parse_args()

    image_path = Path(args.image)
    if not image_path.is_file():
        raise SystemExit(f"Không tìm thấy file: {image_path}")

    from detect_component_module.yolo_detector import YoloComponentDetector

    print("Đang load model YOLO...")
    detector = YoloComponentDetector()

    print(f"Đang render/đọc ảnh {image_path}...")
    image = load_image(image_path)
    print(f"Kích thước ảnh: {image.width}x{image.height}")

    detections = detector.detect(image, confidence_threshold=args.confidence_threshold)
    print(f"\nĐã detect {len(detections)} vùng:")
    for d in sorted(detections, key=lambda d: d.box.y_min):
        print(f"  {d.component:<28} conf={d.confidence:.2f}  y=({d.box.y_min:.0f}, {d.box.y_max:.0f})")

    gaps = find_gaps(image, detections, args.min_gap_height)
    if not gaps:
        print("\nKhông có khoảng trống đáng chú ý — model đã phủ gần hết chiều cao ảnh.")
        return

    out_dir = Path(args.out_dir) if args.out_dir else HERE / "review" / image_path.stem
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{len(gaps)} vùng NGHI NGỜ bị bỏ sót (đã lưu crop vào {out_dir}):")
    for i, (y_min, y_max) in enumerate(gaps):
        crop = image.crop((0, int(y_min), image.width, int(y_max)))
        out_path = out_dir / f"gap_{i:02d}_{int(y_min)}-{int(y_max)}.png"
        crop.save(out_path)
        print(f"  [{i}] y=({y_min:.0f}, {y_max:.0f}) cao {y_max - y_min:.0f}px -> {out_path}")
        print(f"      Sau khi xác định đúng component_id, thêm bằng:")
        print(f'      python add_hard_crop.py "{image_path}" <component_id> 0 {int(y_min)} {image.width} {int(y_max)}')


if __name__ == "__main__":
    main()
