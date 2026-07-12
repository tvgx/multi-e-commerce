"""
Fine-tune YOLO trên dataset ảo sinh bởi build_dataset.py.

Chạy (từ gen_fe_module/yolo_dataset/):
    python train_yolo.py --epochs 40 --model yolov8n.pt

Weights tốt nhất sau khi train nằm ở runs/detect/<name>/weights/best.pt — copy (hoặc trỏ
DETECT_COMPONENT_YOLO_WEIGHTS) vào đó để server.py/detect_component_module dùng.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252, không encode được tiếng Việt

HERE = Path(__file__).resolve().parent


def main() -> None:
    from ultralytics import YOLO

    parser = argparse.ArgumentParser(description="Fine-tune YOLO trên dataset component UI ảo")
    parser.add_argument("--data", default=str(HERE / "data.yaml"))
    parser.add_argument("--model", default="yolov8n.pt", help="Checkpoint gốc để fine-tune (tải tự động lần đầu)")
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--name", default="gfm_component_yolo")
    # Mặc định 0 (tắt multiprocessing DataLoader) — trên Windows, worker>0 kết hợp cv2.warpAffine
    # (augment xoay/co giãn ảnh) hay crash ngẫu nhiên với lỗi cấp phát bộ nhớ giả (SystemError từ
    # worker process, không phải thật sự hết RAM). Tăng lên nếu máy chạy Linux/không gặp lỗi này.
    parser.add_argument("--workers", type=int, default=0)
    args = parser.parse_args()

    model = YOLO(args.model)
    model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        name=args.name,
        project=str(HERE / "runs"),
        workers=args.workers,
    )


if __name__ == "__main__":
    main()
