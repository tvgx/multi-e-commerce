"""
Chụp 1 URL thật (full-page, khác /detect-url của server.py vốn chỉ chụp đúng khung viewport cho
gọn) kèm HTML + toạ độ các khối DOM cấp cao — dùng để PHÂN LOẠI chính xác hơn khi bổ sung dữ liệu
train từ trường hợp thật theo link (xem yolo_dataset/README.md mục "Bổ sung dữ liệu train từ
trường hợp thật"): nhìn ảnh không luôn đủ để biết 1 vùng YOLO bỏ sót là component thật nào, HTML
(tag/id/class/text) thường cho manh mối rõ hơn (vd class "hero-banner", "product-grid"...).

Dùng:
    python fetch_url_debug.py https://example.com [thư_mục_ra]

Output (trong thư_mục_ra, mặc định ./url_debug/<tên miền>/):
    screenshot.png   ảnh full-page
    page.html        HTML đầy đủ sau khi trang đã render
    sections.json     danh sách khối DOM cấp cao (tag, id, class, text rút gọn, bounding box pixel
                       khớp toạ độ trên screenshot.png) — full-width, đủ cao để coi là 1 "section"
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252, không encode được tiếng Việt

DEFAULT_VIEWPORT = {"width": 1440, "height": 900}

# Lấy các khối ứng viên "section" cấp cao: header/footer/nav + con trực tiếp của body/main có bề
# rộng gần khớp viewport (full-width, đúng giả định trong synth.py) và đủ cao để không phải rác.
COLLECT_SECTIONS_JS = """
() => {
  const vw = document.documentElement.clientWidth;
  const results = [];
  const seen = new Set();

  function pushEl(el) {
    if (!el || seen.has(el)) return;
    const rect = el.getBoundingClientRect();
    if (rect.height < 40) return;
    if (rect.width < vw * 0.6) return;  // không full-width -> khó là 1 section top-level
    seen.add(el);
    const text = (el.innerText || "").trim().replace(/\\s+/g, " ").slice(0, 160);
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      className: typeof el.className === "string" ? el.className : null,
      text,
      box: {
        x_min: rect.left + window.scrollX,
        y_min: rect.top + window.scrollY,
        x_max: rect.right + window.scrollX,
        y_max: rect.bottom + window.scrollY,
      },
    });
  }

  document.querySelectorAll("header, footer, nav").forEach(pushEl);
  const root = document.querySelector("main") || document.body;
  Array.from(root.children).forEach(pushEl);

  results.sort((a, b) => a.box.y_min - b.box.y_min);
  return results;
}
"""


def fetch(url: str, out_dir: Path) -> None:
    from playwright.sync_api import sync_playwright

    out_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport=DEFAULT_VIEWPORT)
            page.goto(url, wait_until="networkidle", timeout=30_000)

            page.screenshot(path=str(out_dir / "screenshot.png"), full_page=True)
            (out_dir / "page.html").write_text(page.content(), encoding="utf-8")

            sections = page.evaluate(COLLECT_SECTIONS_JS)
            (out_dir / "sections.json").write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")

            print(f"Đã lưu vào {out_dir}: screenshot.png, page.html, sections.json ({len(sections)} khối)")
        finally:
            browser.close()


def slug_for(url: str) -> str:
    domain = re.sub(r"^https?://", "", url).split("/")[0]
    return re.sub(r"[^a-zA-Z0-9.-]", "_", domain)


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(1)
    url = sys.argv[1]
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent / "url_debug" / slug_for(url)
    fetch(url, out_dir)


if __name__ == "__main__":
    main()
