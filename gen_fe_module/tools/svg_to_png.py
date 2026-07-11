"""
Convert 1 file SVG (hoặc file text chứa markup SVG, bất kể đuôi file) thành PNG bằng Chromium
headless (Playwright) — dùng cho ảnh export từ Figma/design tool (thường rất cao, vd cả 1 trang),
để dùng làm "ảnh gốc" test detect_component_module hoặc bổ sung hard_crops (xem
detect_component_module/README.md).

Dùng:
    python svg_to_png.py <đường_dẫn_svg> [đường_dẫn_png_ra]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252, không encode được tiếng Việt

MAX_HEIGHT = 16000  # Chromium giới hạn kích thước ảnh chụp full-page ở khoảng này


def parse_svg_size(svg_text: str) -> tuple[int, int]:
    root_match = re.search(r"<svg\b[^>]*>", svg_text)
    root = root_match.group(0) if root_match else svg_text[:500]

    w_match = re.search(r'width="(\d+(?:\.\d+)?)"', root)
    h_match = re.search(r'height="(\d+(?:\.\d+)?)"', root)
    if w_match and h_match:
        return int(float(w_match.group(1))), int(float(h_match.group(1)))

    vb_match = re.search(r'viewBox="[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)"', root)
    if vb_match:
        return int(float(vb_match.group(1))), int(float(vb_match.group(2)))

    return 1440, 900


def render_svg_to_image(svg_path: Path):
    """Render 1 file SVG (nội dung markup, bất kể đuôi file) thành `PIL.Image` trong bộ nhớ — dùng
    chung bởi CLI convert() bên dưới và tools/add_hard_crop.py (crop trực tiếp từ SVG, không cần
    xuất PNG trung gian thủ công)."""
    import io

    from PIL import Image
    from playwright.sync_api import sync_playwright

    svg_text = svg_path.read_text(encoding="utf-8")
    width, height = parse_svg_size(svg_text)
    viewport_height = min(height, MAX_HEIGHT)

    html = f"<!doctype html><html><head><style>*{{margin:0;padding:0}}</style></head><body>{svg_text}</body></html>"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": width, "height": viewport_height})
            page.set_content(html, wait_until="networkidle")
            png_bytes = page.screenshot(full_page=True)
        finally:
            browser.close()

    return Image.open(io.BytesIO(png_bytes)).convert("RGB")


def is_svg_file(path: Path) -> bool:
    """Nhận diện SVG bất kể đuôi file (vd export từ Figma lưu nhầm thành .txt) — kiểm tra đuôi
    ".svg" trước, nếu không thì "đánh hơi" vài KB đầu file xem có thẻ "<svg" không."""
    if path.suffix.lower() == ".svg":
        return True
    try:
        head = path.read_text(encoding="utf-8", errors="ignore")[:2048]
    except Exception:
        return False
    return "<svg" in head


def convert(svg_path: Path, out_path: Path) -> None:
    img = render_svg_to_image(svg_path)
    img.save(out_path)
    print(f"Đã lưu {out_path} ({img.width}x{img.height})")


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(1)

    svg_path = Path(sys.argv[1])
    if not svg_path.is_file():
        raise SystemExit(f"Không tìm thấy file: {svg_path}")

    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else svg_path.with_suffix(".png")
    convert(svg_path, out_path)


if __name__ == "__main__":
    main()
