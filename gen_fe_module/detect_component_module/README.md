# detect_component_module

Nhận diện component UI THẬT (section trong `@ecommerce/ui-registry` — `Hero`, `Header`, `Footer`,
`FeaturedProducts`...) trong 1 ảnh chụp trang web: loại component + vị trí + độ tin cậy. Dùng model
**YOLO** fine-tune trên dữ liệu ảo sinh từ chính các component thật (chụp khít qua
`gen_fe_module/preview-app`, props ngẫu nhiên mỗi lần chụp để model học đặc trưng thị giác chứ
không học thuộc text/nội dung cụ thể). Xem [`../yolo_dataset/README.md`](../yolo_dataset/README.md)
để tự sinh dữ liệu + train — module không kèm sẵn weights.

`componentId` model trả về LÀ đúng tên component thật trong `packages/ui-registry` — không qua bước
ánh xạ nào — nên `detections_to_layout()` (`layout_export.py`) xuất JSON dùng thẳng được cho
builder/storefront thật (hợp lệ theo `packages/schema/src/layout.schema.ts`).

## Cài đặt

```bash
pip install -r ../requirements.txt
```

`torch`/`Pillow`/`numpy` có thể đã có sẵn qua 1 bản cài khác (vd conda) — pip sẽ bỏ qua nếu bản
hiện tại đã thoả yêu cầu version.

## Dùng qua server HTTP

Xem [`../server.py`](../server.py) — chạy `python ../server.py`.

## Dùng qua trang web test (khuyến nghị để tự kiểm tra)

`gen_fe_module/app/index.html` (mở ở `/`, chạy `npm run dev` trong `gen_fe_module/app`) — 3 chế độ:

1. **Test có giám sát** — tự sinh 1 ảnh "trang web giả" (xếp chồng dọc ngẫu nhiên nhiều section
   thật lên canvas), biết trước chính xác vị trí/loại từng component nên **tính được độ chính xác
   thật** (precision/recall/F1) của model, không chỉ nhìn bằng mắt.
2. **Tải ảnh lên** — test model trên ảnh chụp trang web thật do bạn cung cấp. Chọn "Loại trang" ở
   thanh cấu hình TRƯỚC khi tải lên — mỗi loại trang lưu ảnh + kết quả detect RIÊNG (đổi lại
   dropdown "Loại trang" sẽ hiện lại đúng ảnh đã lưu, không cần tải lại). Component GLOBAL
   (`Header`/`Footer`/`AnnouncementBar` — hiển thị chung mọi trang, xem
   `packages/schema/src/layout.schema.ts`) được tự động TÁCH RIÊNG khỏi JSON của từng trang, gom
   vào panel "Component global đã phát hiện" — nếu phát hiện được từ nhiều ảnh khác nhau (vd Header
   detect được cả ở ảnh "home" lẫn ảnh "about"), chọn 1 bản làm chính thức. Xuất được cả JSON
   `ShopGlobalLayoutSchema` (global) lẫn `ShopPageLayoutSchema` cho từng loại trang đã lưu.
3. **Nhập URL** — server tự chụp ảnh 1 trang web (Playwright) rồi test — chỉ chấp nhận URL công
   khai, server tự chặn địa chỉ nội bộ để tránh SSRF (xem `url_safety.py`).

Cần chạy cả `python server.py` (backend) lẫn `npm run dev` (frontend, trong `gen_fe_module/app`)
song song.

## Output

```json
{
  "count": 2,
  "image_size": { "width": 1400, "height": 2600 },
  "detections": [
    {
      "group": "section",
      "component": "Hero",
      "variant": null,
      "confidence": 0.94,
      "box": { "x_min": 0, "y_min": 0, "x_max": 1400, "y_max": 640 }
    }
  ],
  "layout": {
    "shopId": null,
    "pageType": "home",
    "components": [
      { "id": "...", "componentId": "Hero", "type": "section", "props": {}, "order": 0 }
    ]
  }
}
```

`box` là toạ độ pixel trên ảnh đầu vào (gốc top-left). `variant` luôn `null` (YOLO không phân biệt
style/preset). `layout` là JSON hợp lệ theo `ShopPageLayoutSchema` — có thể copy thẳng vào builder
hoặc dùng để render qua `DynamicRenderer` của storefront.

## Cấu trúc module

- `yolo_detector.py` — `YoloComponentDetector`: bọc quanh model YOLO đã fine-tune (xem
  `../yolo_dataset/`), load 1 lần dùng lại nhiều lượt. `model.names` chính là danh sách
  componentId thật (vd `Hero`, `Header`...).
- `types.py` — `Detection`/`BoundingBox` dùng chung.
- `synth.py` — sinh ảnh "trang web giả" kèm ground-truth (xếp chồng dọc ngẫu nhiên các crop
  component thật lên canvas) — dùng chung bởi `../yolo_dataset/build_dataset.py` (sinh dữ liệu
  train hàng loạt) và `server.py` (`GET /sample-test`, sinh theo yêu cầu cho trang test).
- `scoring.py` — so khớp IoU giữa box model đoán và ground truth, tính precision/recall/F1 — chỉ
  dùng được khi có ground truth (chế độ "test có giám sát").
- `layout_export.py` — `detections_to_layout()`: convert `list[Detection]` -> JSON hợp lệ theo
  `ShopPageLayoutSchema` (componentId khớp đúng registry thật).
- `url_safety.py` — chặn SSRF khi server tự fetch 1 URL người dùng nhập (`POST /detect-url`).
- `screenshot.py` — chụp ảnh 1 URL bằng Playwright (Python), dùng cho `POST /detect-url`.

## Cải thiện model khi gặp trường hợp thật bị bỏ sót

Nếu model không detect được 1 component thật trên 1 trang cụ thể (do ảnh/text/theme khác nhiều so
với dữ liệu ảo lúc train), có thể bổ sung crop THẬT của trường hợp đó vào tập train bằng
`gen_fe_module/tools/find_gaps.py` (tự động khoanh vùng model bỏ sót — không tự phân loại được),
`gen_fe_module/tools/add_hard_crop.py` (crop từ ảnh gốc/SVG theo toạ độ, gán đúng componentId) và
`gen_fe_module/tools/fetch_url_debug.py` (chụp full-page + lưu HTML/toạ độ DOM của 1 URL, giúp
phân loại đúng hơn khi chỉ nhìn ảnh không đủ rõ) — xem
[`../yolo_dataset/README.md`](../yolo_dataset/README.md) mục "Bổ sung dữ liệu train từ trường hợp
thật" để biết quy trình đầy đủ, rồi chạy lại `build_dataset.py` + `train_yolo.py`.

## Bảo mật

`server.py` chỉ dành cho dùng nội bộ (máy dev), có 2 lớp chặn: (1) chỉ bind `127.0.0.1`, không
nghe trên mạng LAN; (2) CORS chỉ chấp nhận Origin `localhost`/`127.0.0.1` — chặn kiểu tấn công
"trang web độc hại mở trong trình duyệt tự gọi vào server qua JS" (request đó vẫn tính là "từ
localhost" nên riêng bind `127.0.0.1` không chặn được). Riêng `POST /detect-url` còn validate URL
trước khi fetch để chặn SSRF (không cho trỏ vào địa chỉ nội bộ/loopback/link-local) — xem
`url_safety.py` để biết giới hạn còn lại (DNS-rebinding). KHÔNG deploy server này ra ngoài mạng
nội bộ mà không xem lại toàn bộ phần bảo mật này trước.
