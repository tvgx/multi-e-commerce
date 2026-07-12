"""Chụp ảnh 1 URL do người dùng nhập bằng Playwright (Python) headless Chromium — dùng cho
POST /detect-url trong server.py (chế độ "nhập URL" của trang test)."""
from __future__ import annotations

from .url_safety import assert_safe_public_url

NAV_TIMEOUT_MS = 20_000
DEFAULT_VIEWPORT = {"width": 1400, "height": 1000}


def capture_url_screenshot(url: str, viewport: dict[str, int] = DEFAULT_VIEWPORT) -> bytes:
    """Trả về bytes PNG của URL sau khi render (không full-page, chỉ đúng khung viewport — full
    page screenshot của 1 trang lạ có thể cực dài/nặng, không phù hợp cho 1 lượt test nhanh)."""
    assert_safe_public_url(url)

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport=viewport)
            page.goto(url, wait_until="networkidle", timeout=NAV_TIMEOUT_MS)
            # URL cuối cùng sau khi có thể đã redirect — chặn kiểu bypass "URL công khai redirect
            # sang địa chỉ nội bộ". Vẫn còn khe hở DNS-rebinding lý thuyết, xem url_safety.py.
            assert_safe_public_url(page.url)
            return page.screenshot()
        finally:
            browser.close()
