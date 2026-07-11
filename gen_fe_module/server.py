"""
Server HTTP (chỉ dùng thư viện chuẩn Python, không phụ thuộc framework ngoài) chạy
detect_component_module: nhận 1 ảnh chụp trang web, trả về JSON danh sách component THẬT
(section trong @ecommerce/ui-registry — Hero, Header, Footer, FeaturedProducts...) nhận diện
được (loại, vị trí, độ tin cậy), bằng model YOLO fine-tune (xem gen_fe_module/yolo_dataset/README.md).

Chạy:
    python server.py

Port mặc định 8600 — đã kiểm tra không trùng với port nào khác đang dùng trong dự án (3000-3002,
3100, 5173, 5432-5433, 6379, 6543, 8080, 9000-9001, 9090, 27017...). Override bằng biến môi
trường DETECT_COMPONENT_PORT (hoặc PORT).

BẢO MẬT — server chỉ dành cho dùng nội bộ (dev machine), 2 lớp chặn:
  1. Chỉ bind 127.0.0.1 (không nghe trên mạng LAN) — override bằng DETECT_COMPONENT_HOST nếu THẬT
     SỰ hiểu rõ rủi ro khi mở ra ngoài.
  2. CORS chỉ chấp nhận Origin là localhost/127.0.0.1 (bất kể port) — chặn kiểu tấn công "trang
     web độc hại mở trong trình duyệt tự gọi vào server qua JS" (request đó vẫn tính là "từ
     localhost" nên riêng việc bind 127.0.0.1 không chặn được, phải xiết thêm CORS).
  Endpoint /detect-url (server tự tải 1 URL người dùng nhập) còn có thêm bước validate URL chống
  SSRF — xem detect_component_module/url_safety.py.

API:
    GET  /health              -> {"status": "ok", "backend": ..., "device": ...}
    POST /detect?<query>      -> body là bytes ảnh thô (png/jpg/...) — chế độ "tải ảnh lên"
    POST /detect-url          -> body JSON {"url": "https://..."} — chế độ "nhập URL", server tự
                                  chụp ảnh trang đó (Playwright) rồi detect
    GET  /sample-test?<query> -> sinh 1 ảnh "trang web giả" kèm ground-truth (ghép ngẫu nhiên các
                                  ảnh component mẫu, biết trước chính xác vị trí/loại), chạy detect
                                  trên đó, trả về cả ground-truth lẫn kết quả model + điểm chính
                                  xác (precision/recall/f1) — chế độ "test có giám sát"

    /detect, /detect-url và /sample-test dùng chung query params:
        groups=section                  chỉ xét các nhóm này (hiện tại mọi class đều group="section")
        page_type=home                  gán vào layout.pageType trong response — bỏ trống để tự
                                         suy luận qua infer_page_type() (xem layout_export.py)
        confidence_threshold=0.25, nms_iou_threshold=0.45

    /detect, /detect-url, /sample-test đều trả kèm "image_size" (và "image_base64" với 2 endpoint
    sau — ảnh không có sẵn ở phía client như /detect) và "layout" — JSON hợp lệ theo
    packages/schema/src/layout.schema.ts (ShopPageLayoutSchema), componentId khớp đúng tên trong
    packages/ui-registry — xem detect_component_module/layout_export.py.

Ví dụ:
    curl -X POST --data-binary @screenshot.png \\
      "http://localhost:8600/detect?groups=button,card&confidence_threshold=0.4"
    curl -X POST -H "Content-Type: application/json" -d '{"url":"https://example.com"}' \\
      http://localhost:8600/detect-url
    curl http://localhost:8600/sample-test
"""
from __future__ import annotations

import base64
import io
import json
import logging
import os
import re
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252, không encode được tiếng Việt

from detect_component_module.layout_export import detections_to_layout
from detect_component_module.scoring import score_detections
from detect_component_module.screenshot import capture_url_screenshot
from detect_component_module.synth import build_synthetic_image
from detect_component_module.url_safety import UnsafeUrlError
from detect_component_module.yolo_detector import YoloComponentDetector

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("detect_component_server")

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8600
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25MB — đủ cho ảnh full-page screenshot, chặn body vô hạn
MAX_JSON_BODY_BYTES = 10 * 1024  # body JSON (vd {"url": "..."}) không cần lớn

# Chỉ chấp nhận CORS cho origin chạy trên localhost/127.0.0.1 (mọi port) — xem docstring "BẢO MẬT".
_LOCALHOST_ORIGIN_RE = re.compile(r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$")

# Cả 2 backend đều chưa chắc thread-safe khi chạy song song nhiều forward pass trên cùng 1 model
# instance (đặc biệt trên GPU) -> khoá lại để mọi request /detect* chạy tuần tự.
_detect_lock = threading.Lock()


def _parse_query(query: str) -> dict[str, str]:
    return {k: v[0] for k, v in parse_qs(query).items()}


def _detect_kwargs_from_params(params: dict[str, str]) -> dict:
    groups = [g.strip() for g in params["groups"].split(",")] if "groups" in params else None
    return {
        "groups": groups,
        "confidence_threshold": float(params.get("confidence_threshold", 0.25)),
        "nms_iou_threshold": float(params.get("nms_iou_threshold", 0.45)),
    }


class DetectHandler(BaseHTTPRequestHandler):
    detector: YoloComponentDetector  # gán ở main(), dùng chung mọi request
    backend: str  # luôn "yolo" — giữ field để tương thích response /health

    def _cors_origin(self) -> str | None:
        origin = self.headers.get("Origin")
        return origin if origin and _LOCALHOST_ORIGIN_RE.match(origin) else None

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        origin = self._cors_origin()
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # preflight CORS
        self.send_response(204)
        origin = self._cors_origin()
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._send_json(200, {"status": "ok", "backend": self.backend, "device": self.detector.device})
            return
        if parsed.path == "/sample-test":
            self._handle_sample_test(_parse_query(parsed.query))
            return
        self._send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/detect":
            self._handle_detect(_parse_query(parsed.query))
            return
        if parsed.path == "/detect-url":
            self._handle_detect_url()
            return
        self._send_json(404, {"error": "not found"})

    def _read_body(self, max_bytes: int) -> bytes | None:
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length <= 0:
            self._send_json(400, {"error": "thiếu body trong request"})
            return None
        if length > max_bytes:
            self._send_json(413, {"error": f"body vượt quá giới hạn {max_bytes} bytes"})
            return None
        return self.rfile.read(length)

    def _run_detect(self, image: Image.Image, params: dict[str, str]) -> list | None:
        """Trả về list[Detection], hoặc None nếu đã tự gửi response lỗi (caller return luôn)."""
        try:
            detect_kwargs = _detect_kwargs_from_params(params)
        except ValueError:
            self._send_json(400, {"error": "tham số query không hợp lệ (threshold phải là số)"})
            return None
        try:
            with _detect_lock:
                return self.detector.detect(image, **detect_kwargs)
        except ValueError as e:
            self._send_json(422, {"error": str(e)})
            return None
        except Exception:
            logger.exception("Detect thất bại")
            self._send_json(500, {"error": "detect thất bại, xem log server"})
            return None

    def _handle_detect(self, params: dict[str, str]) -> None:
        raw = self._read_body(MAX_UPLOAD_BYTES)
        if raw is None:
            return
        try:
            image = Image.open(io.BytesIO(raw))
            image.load()
        except Exception:
            self._send_json(400, {"error": "không đọc được ảnh — hãy gửi bytes ảnh hợp lệ (png/jpg) trong request body"})
            return

        detections = self._run_detect(image, params)
        if detections is None:
            return

        self._send_json(
            200,
            {
                "count": len(detections),
                "image_size": {"width": image.width, "height": image.height},
                "detections": [d.to_dict() for d in detections],
                "layout": detections_to_layout(detections, page_type=params.get("page_type") or None),
            },
        )

    def _handle_detect_url(self) -> None:
        raw = self._read_body(MAX_JSON_BODY_BYTES)
        if raw is None:
            return
        try:
            payload = json.loads(raw)
            url = payload["url"]
            if not isinstance(url, str) or not url.strip():
                raise ValueError
        except Exception:
            self._send_json(400, {"error": 'body phải là JSON hợp lệ: {"url": "https://..."}'})
            return

        try:
            png_bytes = capture_url_screenshot(url.strip())
        except UnsafeUrlError as e:
            self._send_json(400, {"error": str(e)})
            return
        except Exception as e:
            logger.exception("Chụp URL thất bại")
            self._send_json(502, {"error": f"Không chụp được trang: {e}"})
            return

        image = Image.open(io.BytesIO(png_bytes))
        image.load()

        params = _parse_query(urlparse(self.path).query)
        detections = self._run_detect(image, params)
        if detections is None:
            return

        self._send_json(
            200,
            {
                "image_base64": base64.b64encode(png_bytes).decode("ascii"),
                "count": len(detections),
                "image_size": {"width": image.width, "height": image.height},
                "detections": [d.to_dict() for d in detections],
                "layout": detections_to_layout(detections, page_type=params.get("page_type") or None),
            },
        )

    def _handle_sample_test(self, params: dict[str, str]) -> None:
        try:
            canvas, ground_truth = build_synthetic_image()
        except ValueError as e:
            self._send_json(422, {"error": str(e)})
            return

        detections = self._run_detect(canvas, params)
        if detections is None:
            return

        score = score_detections(ground_truth, detections)

        buf = io.BytesIO()
        canvas.save(buf, format="PNG")

        self._send_json(
            200,
            {
                "image_base64": base64.b64encode(buf.getvalue()).decode("ascii"),
                "image_size": {"width": canvas.width, "height": canvas.height},
                "ground_truth": [g.to_dict() for g in ground_truth],
                "detections": [d.to_dict() for d in detections],
                "score": score.to_dict(),
                "layout": detections_to_layout(detections, page_type=params.get("page_type") or None),
            },
        )

    def log_message(self, format: str, *args) -> None:  # noqa: A002 - override chữ ký gốc của BaseHTTPRequestHandler
        logger.info("%s - %s", self.address_string(), format % args)


def main() -> None:
    host = os.environ.get("DETECT_COMPONENT_HOST", DEFAULT_HOST)
    port = int(os.environ.get("DETECT_COMPONENT_PORT") or os.environ.get("PORT") or DEFAULT_PORT)
    DetectHandler.backend = "yolo"

    device = os.environ.get("DETECT_COMPONENT_DEVICE")  # vd "cpu" — ép CPU khi GPU đang bận (vd đang train)

    yolo_kwargs: dict[str, str] = {}
    if os.environ.get("DETECT_COMPONENT_YOLO_WEIGHTS"):
        yolo_kwargs["weights_path"] = os.environ["DETECT_COMPONENT_YOLO_WEIGHTS"]
    if device:
        yolo_kwargs["device"] = device
    logger.info("Đang load model YOLO...")
    DetectHandler.detector = YoloComponentDetector(**yolo_kwargs)

    logger.info("Model sẵn sàng (device=%s).", DetectHandler.detector.device)

    server = ThreadingHTTPServer((host, port), DetectHandler)
    logger.info("detect_component_module server đang chạy tại http://%s:%d", host, port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
