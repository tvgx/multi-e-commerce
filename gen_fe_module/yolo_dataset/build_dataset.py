"""
Xếp chồng dọc các ảnh section thật đã chụp khít (raw_crops/, do
../preview-app/scripts/capture-crops.mts tạo ra — component thật từ @ecommerce/ui-registry) thành
ảnh "trang web giả" + nhãn YOLO (class + bounding box) tương ứng — dữ liệu train cho
detect_component_module bản YOLO. Logic ghép ảnh thật sự nằm ở
../detect_component_module/synth.py (dùng chung với chế độ "test có giám sát" GET /sample-test
trong server.py) — file này chỉ lo phần batch-generate + ghi ra định dạng YOLO.

Chạy (từ gen_fe_module/yolo_dataset/), sau khi đã chạy capture-crops.mts:
    python build_dataset.py --num-images 2000

Output:
    images/train/*.jpg, images/val/*.jpg
    labels/train/*.txt, labels/val/*.txt   (định dạng YOLO: "class_id xc yc w h", giá trị 0..1)
    data.yaml                              (config Ultralytics YOLO cần để train)
"""
from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252, không encode được tiếng Việt

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))  # để import được detect_component_module (nằm ngoài yolo_dataset/)

from detect_component_module.synth import DEFAULT_MANIFEST_PATH, build_synthetic_image, load_manifest  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Ghép ảnh component thành dataset YOLO")
    parser.add_argument("--num-images", type=int, default=2000)
    parser.add_argument("--val-ratio", type=float, default=0.1)
    parser.add_argument("--min-instances", type=int, default=3)
    parser.add_argument("--max-instances", type=int, default=7)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    by_class, class_types = load_manifest()
    if not by_class:
        raise SystemExit(
            f"Không đọc được crop nào từ {DEFAULT_MANIFEST_PATH} — hãy chạy "
            "`npx tsx ../preview-app/scripts/capture-crops.mts` trước (cần `npm run dev` trong "
            "preview-app đang chạy)."
        )
    class_names = sorted(by_class.keys())
    print(f"{len(class_names)} class, tổng {sum(len(v) for v in by_class.values())} ảnh crop nguồn.")

    for split in ("train", "val"):
        (HERE / "images" / split).mkdir(parents=True, exist_ok=True)
        (HERE / "labels" / split).mkdir(parents=True, exist_ok=True)

    n_val = max(1, int(args.num_images * args.val_ratio))
    n_train = args.num_images - n_val

    counts = {"train": n_train, "val": n_val}
    total_written = 0
    for split, count in counts.items():
        for i in range(count):
            canvas, ground_truth = build_synthetic_image(
                by_class, class_types, rng, args.min_instances, args.max_instances
            )
            if not ground_truth:
                continue
            stem = f"{split}_{i:05d}"
            canvas.save(HERE / "images" / split / f"{stem}.jpg", quality=90)
            with open(HERE / "labels" / split / f"{stem}.txt", "w", encoding="utf-8") as f:
                for gt in ground_truth:
                    class_id = class_names.index(gt.component)
                    x_min, y_min, x_max, y_max = gt.box
                    xc = (x_min + x_max) / 2 / canvas.width
                    yc = (y_min + y_max) / 2 / canvas.height
                    wn = (x_max - x_min) / canvas.width
                    hn = (y_max - y_min) / canvas.height
                    f.write(f"{class_id} {xc:.6f} {yc:.6f} {wn:.6f} {hn:.6f}\n")
            total_written += 1
        print(f"{split}: đã ghi {count} ảnh.")

    data_yaml = HERE / "data.yaml"
    with open(data_yaml, "w", encoding="utf-8") as f:
        f.write(f"path: {HERE.as_posix()}\n")
        f.write("train: images/train\n")
        f.write("val: images/val\n")
        f.write(f"nc: {len(class_names)}\n")
        f.write("names:\n")
        for name in class_names:
            f.write(f"  - {name}\n")

    print(f"Tổng {total_written} ảnh, data.yaml đã ghi tại {data_yaml}")


if __name__ == "__main__":
    main()
