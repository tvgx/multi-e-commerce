# yolo_dataset — sinh dữ liệu ảo + fine-tune YOLO cho detect_component_module

Fine-tune 1 model **YOLO** để nhận diện các section THẬT của `@ecommerce/ui-registry` (`Hero`,
`Header`, `Footer`, `FeaturedProducts`, ... — 43 component `type: "section"`, xem
`packages/ui-registry/src/component-schemas.ts`), bằng dữ liệu **ảo**: chụp khít từng component
thật qua `gen_fe_module/preview-app` (props ngẫu nhiên mỗi lần chụp — text/màu/ảnh đổi liên tục để
model học hình dáng/màu sắc/bố cục, KHÔNG học thuộc nội dung cụ thể), rồi xếp chồng dọc ngẫu nhiên
nhiều component lên canvas giả lập 1 trang web thật (section luôn full-width, xếp từ trên xuống).

## Các bước

```bash
# 1. Chạy dev server của preview-app (giữ chạy suốt bước 2)
cd ../preview-app && npm run dev

# 2. Chụp ảnh khít từng section + đổi props ngẫu nhiên (Playwright điều khiển Next.js app thật)
#    ~40 mẫu/component, có thể mất 1-2 giờ (43 component x 40 mẫu).
#    Output: raw_crops/<componentId>/*.png + manifest.json
CAPTURE_SAMPLES_PER_COMPONENT=40 npx tsx scripts/capture-crops.mts

# 3. Ghép các crop lên canvas ngẫu nhiên -> ảnh + nhãn YOLO (images/, labels/, data.yaml)
pip install pillow
python build_dataset.py --num-images 2200

# 4. Fine-tune (cần package `ultralytics`, xem ../requirements.txt). --workers 0 để tránh lỗi
#    DataLoader multiprocessing trên Windows.
pip install ultralytics
python train_yolo.py --epochs 50 --workers 0

# 5. Dùng — server.py tự dùng weights tại runs/gfm_component_yolo/weights/best.pt (mặc định),
#    không cần cấu hình gì thêm.
cd .. && python server.py
```

## Vì sao chụp khít + đổi props ngẫu nhiên?

- **Chụp khít** (`capture-crops.mts` lấy `boundingBox()` của `#gfm-preview-root`, không có viền
  nền thừa) — tránh tín hiệu bị pha loãng bởi nền trống xung quanh.
- **Đổi props ngẫu nhiên mỗi lần chụp** (text/màu/ảnh/số lượng item, theo đúng `FieldSchema` khai
  báo trong `component-schemas.ts`) — bắt YOLO học đặc trưng THỊ GIÁC (hình dáng, màu nền/viền, bố
  cục) để phân biệt component, thay vì "học thuộc" 1 nội dung cố định — component thật trên các
  trang web khác nhau luôn có nội dung khác nhau.
- **Xếp chồng dọc thay vì scatter ngẫu nhiên** (khác cách làm cũ) — vì section thật trên 1 trang
  web luôn full-width và xếp từ trên xuống dưới, không bị co giãn/chồng lấn như các UI atom nhỏ.

## Component bị loại khỏi tập train

Chỉ train trên component `type: "section"` (43/54 component trong `component-schemas.ts`). Các
component `type: "block"` (`HeaderMenuItem`, `SlideItem`, `FooterColumn`, `SearchBar`,
`ProductCardImage`/`Name`/`Price`/`Button`/`Rating`, `HeaderLanguageSwitcher`, `HeaderCartTrigger`)
bị loại vì chỉ render đúng khi lồng trong 1 section cha (Header/Carousel/Footer/ProductCard) —
render đơn lẻ sẽ lỗi hoặc không có ý nghĩa, và cũng không xuất hiện độc lập trong
`ShopPageLayoutSchema.components[]` (chỉ chứa section top-level).

## Class

Tên class = đúng `componentId` thật (vd `Hero`, `FeaturedProducts`) — lấy trực tiếp từ key trong
`ComponentSchemas` (`@ecommerce/ui-registry`). Xem `data.yaml` (sinh ra ở bước 3) để có danh sách
đầy đủ.

## Bổ sung dữ liệu train từ trường hợp thật (hard examples)

Component thật trên 1 trang web cụ thể có thể khác khá nhiều so với props ngẫu nhiên lúc train
(ảnh/text/theme khác) — khi đó YOLO có thể bỏ sót (không detect được) 1 vùng dù nó thực chất là 1
component đã biết. `hard_crops/` là nơi bổ sung THỦ CÔNG các crop thật này vào tập train, gộp
chung với `raw_crops/` (xem `detect_component_module/synth.py` — `load_manifest()`).

Quy trình (2 dạng, xem `detect_component_module/README.md` để biết thêm chi tiết công cụ):

0. **(Khuyến nghị) Tự động khoanh vùng nghi ngờ trước** — `tools/find_gaps.py` chạy model hiện có
   trên ảnh/SVG, gộp các vùng ĐÃ detect theo trục dọc rồi trả về phần CÒN LẠI (kèm crop sẵn để xem
   nhanh + lệnh `add_hard_crop.py` đã điền sẵn toạ độ) — khỏi phải tự đoán x_min/y_min/x_max/y_max
   bằng mắt. Chỉ khoanh vùng, KHÔNG tự phân loại componentId được (không có tín hiệu tên lớp đáng
   tin cậy trong SVG lẫn ảnh raster — xem docstring script để biết vì sao):
   ```bash
   python tools/find_gaps.py <ảnh_hoặc_svg> [--confidence-threshold 0.25] [--min-gap-height 60]
   ```
1. **Từ ảnh** — có ảnh gốc (đầu vào) và ảnh kết quả detect (đầu ra, có khung các component đã
   nhận diện được) → so 2 ảnh để tìm vùng bị bỏ sót (hoặc dùng `find_gaps.py` ở trên), xác định
   đúng loại component (trong 43 class), rồi crop từ ẢNH GỐC (không phải ảnh có khung vẽ đè lên) bằng:
   ```bash
   python tools/add_hard_crop.py <ảnh_gốc> <component_id> <x_min> <y_min> <x_max> <y_max>
   python tools/add_hard_crop.py --list   # xem số lượng hard crop hiện có mỗi class
   ```
2. **Từ link** — dùng `tools/fetch_url_debug.py <url>` để chụp full-page + lưu HTML + toạ độ các
   khối DOM cấp cao (`sections.json`) — đối chiếu HTML (tag/id/class/text) với vùng bị bỏ sót để
   phân loại chính xác hơn là chỉ nhìn ảnh, sau đó cũng dùng `add_hard_crop.py` để crop.

`add_hard_crop.py` nhận cả ẢNH RASTER (PNG/JPG) lẫn file **SVG** (vd export nguyên trang từ Figma,
bất kể đuôi file — tool tự nhận diện qua nội dung, không cần đuôi `.svg`) làm nguồn — nếu là SVG sẽ
tự render thành raster (Chromium headless, xem `tools/svg_to_png.py`) trước khi crop, không cần
convert thủ công. Toạ độ box tính theo đúng `width`/`height` khai báo trong thẻ `<svg>` (thường
trùng `viewBox`).

Sau khi thêm đủ (khuyến nghị vài chục crop/class trở lên mới có tác dụng rõ), chạy lại `build_dataset.py`
+ `train_yolo.py` (bước 3-4 ở trên) để huấn luyện lại — `hard_crops/` tự động được gộp vào, không
cần chỉnh gì thêm trong 2 script này.

## File tạo ra (không commit — xem `.gitignore`)

`raw_crops/`, `manifest.json`, `images/`, `labels/`, `data.yaml`, `runs/` (kết quả train của
Ultralytics, gồm cả `weights/best.pt`) — chạy lại các bước trên để tái tạo khi cần. Riêng
`hard_crops/` LÀ dữ liệu quý (không tự sinh lại được, phải tuyển thủ công) nên có thể cân nhắc
commit nếu muốn giữ lại lâu dài.
