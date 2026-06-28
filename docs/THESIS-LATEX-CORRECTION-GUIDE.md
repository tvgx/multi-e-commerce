# Guide: Sửa LaTeX đồ án cho khớp codebase thực tế (ShopVolo v2)

> **Cho agent đọc file này:** đây là hướng dẫn sửa source LaTeX (sinh ra `main.pdf`)
> để nội dung **đúng với những gì đang chạy trong repo** `multi-e-commerce`. Mọi
> dữ kiện dưới đây đã được kiểm chứng trực tiếp từ code (có dẫn đường dẫn file).
>
> **Source LaTeX:** nhiều khả năng ở `docs/report/` (repo này có `docs/report/`,
> `docs/images/`, `docs/master-template/`). Hãy `grep` trong đó theo nhãn mục/hình/bảng
> nêu ở Phần D để định vị chỗ cần sửa.
>
> **3 nguyên tắc bắt buộc:**
> 1. **KHÔNG bịa số benchmark.** Phần hiệu năng (Hình 4.8 đang là placeholder rỗng,
>    các câu "sẽ đo sau") chỉ được điền bằng **số đo thật** theo phương pháp ở Phần C.
>    Nếu chưa đo được thì giữ nguyên dạng "phương pháp + chưa có số liệu", KHÔNG chế số.
> 2. **Đối chiếu lại code trước khi sửa.** Codebase thay đổi theo thời gian — verify
>    đường dẫn/biến/cờ còn tồn tại trước khi viết vào báo cáo.
> 3. **Giữ văn phong học thuật + tiếng Việt** như bản gốc. Chỉ sửa nội dung sai/thiếu.

---

## Phần A — Bảng đối chiếu nhanh: Đồ án nói gì vs Thực tế codebase

| # | Đồ án (PDF) | Thực tế codebase | Mức độ |
|---|-------------|------------------|--------|
| 1 | "**bốn ứng dụng**: Admin, API Core, Storefront, **cli-tool**" (Tóm tắt, 1.3, 4.1.1, 6.1) | **5 app**: `admin`, `api-core`, `storefront`, **`design-agent`**, `cli-tool` (+ worker `scripts/shop-builder`) | **Sai — thiếu hẳn 1 app AI** |
| 2 | "**20 mô-đun** nghiệp vụ trong api-core" (4.1.1, Bảng 4.2) | **23 module** (`apps/api-core/src/modules/`) | Sai số đếm |
| 3 | "lược đồ **46 thực thể**" (6.1) vs "**49 mô hình**" (Bảng 4.2) | **49 model** Prisma (`packages/database/prisma/models/*.prisma`, 16 file) | Mâu thuẫn nội bộ → 49 |
| 4 | "trình hướng dẫn **tám bước**" (UC-01 Bảng 2.2, UC-10 Phụ lục) | Onboarding **6 bước** `step1..step6`; step "Verify Domain" **đã gỡ** | Sai — đã lỗi thời |
| 5 | "**6 bước** (tạo cửa hàng, thêm SP, tạo bộ sưu tập, thiết kế giao diện, thanh toán, vận chuyển)" (5.3.3, 6.1) | **Đúng** (`step1`Rocket…`step6`Truck) | OK — dùng số này |
| 6 | Sản xuất hướng **Kubernetes** + **NGINX Ingress** + **Cloudflare Tunnel** + **Grafana** + 2 shard Postgres (2.4, 3.9, 4.5) | Deploy thật: **1 box AWS Lightsail 2GB**, **Docker Compose** + **Caddy** + **Supabase/Atlas free**. (k8s manifest có tồn tại trong `k8s/` nhưng KHÔNG phải đường deploy đang dùng) | Cần tách bạch 2 mức |
| 7 | "API giới hạn **350MB**, Redis **512MB**" (2.4, 4.5) | Compose prod: api-core **450M**, redis **150M** (`--maxmemory 128mb`), admin 350M, storefront 320M, shop-builder 450M, minio 300M, imgproxy 150M, caddy 100M | Sai số |
| 8 | CronJob sao lưu Postgres "**2h sáng**" (2.4) vs "**3h sáng**" (4.5) | Deploy rẻ: Postgres = **Supabase** (backup do Supabase quản lý). k8s có `k8s/backup/` nhưng không chạy ở đường rẻ | Mâu thuẫn + sai bối cảnh |
| 9 | "cli-tool sinh số lượng cửa hàng tăng dần" để benchmark (4.5.1) | `cli-tool` chỉ có `sync:layout`, `watch:layout` — **không sinh shop**. Sinh tải shop phải qua script/API khác | Sai công cụ |
| 10 | Template marketplace là **hướng phát triển tương lai** (6.2) | Module **`theme-market`** đã tồn tại: browse/apply/**publishTheme** + import Figma | Đã có một phần, không phải "tương lai" |
| 11 | Không nhắc | Module **`chat`** (WebSocket `/chat`, `ChatSession`/`ChatMessage`) — chat realtime/chatbot | Thiếu |
| 12 | "**4 bộ sưu tập** MongoDB chính" (Bảng 4.2) | Đúng cho nhóm layout storefront, nhưng còn `page_layouts`, `conversations`, layout-embeddings, `theme_templates` (design-agent) + chat | Nên chú thích phạm vi |
| 13 | Hình 4.8 benchmark = **ô rỗng** "sẽ bổ sung sau" | Chưa có số liệu | Phải đo thật (Phần C) |

---

## Phần B — Sửa theo chủ đề

### B1. Kiến trúc ứng dụng (Tóm tắt, mục 1.3, 3.1, 4.1.1, 6.1)

**Sửa "bốn ứng dụng" → "năm ứng dụng".** Danh sách đúng:

- `admin` — Next.js 16, dashboard chủ cửa hàng (cổng 3001 dev).
- `api-core` — NestJS 11, REST + WebSocket, đa thuê bao (cổng 3000 dev).
- `storefront` — Next.js 16, kết xuất động Zero-file (cổng 3002 dev).
- **`design-agent`** — NestJS, **agent AI** (Claude + RAG + chatbot + trích Figma), cổng 3100 dev. **Đây là app bị bỏ sót trong đồ án.**
- `cli-tool` — công cụ dòng lệnh đồng bộ layout (`sync:layout`, `watch:layout`).

Ngoài ra có **worker nền** `scripts/shop-builder` (consumer Bull queue `shop-build`) — không phải app trong `apps/` nhưng là một tiến trình triển khai độc lập (có image CI riêng `-shop-builder`). Đồ án nên thêm worker này vào sơ đồ gói (Hình 4.1) và mục 4.1.1.

**5 gói dùng chung** (`packages/`) đồ án ghi đúng: `@ecommerce/database`, `schema`,
`master-templates`, `ui-registry`, `i18n`.

**Số module = 23** (không phải 20). Danh sách đầy đủ trong `apps/api-core/src/modules/`:
`analytics, auth, build, cart, catalog, chat, customer-address, email, geo,
interactions, inventory, layout, media, notifications, order, payment, promotions,
shipping, shop, storefront-auth, templates, theme-market, wallet`.
→ Sửa Bảng 4.2 ("Số mô-đun nghiệp vụ trong api-core: 20" → **23**) và mục 4.1.1.

**Số model Prisma = 49** (thống nhất với Bảng 4.2). Sửa mục 6.1 "46 thực thể" → **49**.
Nguồn đếm: `grep -rh "^model " packages/database/prisma/models/ | wc -l` = 49.

### B2. Flow khởi tạo & kết xuất (Hình 2.5, mục 2.2.5, 2.3.1)

Hình 2.5 hiện **thiếu bước build nền (worker + Bull queue)**. Flow thực tế:

1. Chủ shop điền thông tin ở **`create-shop`** — 3 trang:
   - `create-shop/page.tsx` (tên, domain, currency, chọn template theo ngành).
   - `create-shop/design/page.tsx` (+ `design/navigation`) — tùy biến giao diện ban đầu.
   - `create-shop/billing-shipping/page.tsx` — nút **"Lưu và Hoàn tất tạo Shop"**.
2. `POST /api/shops` tạo bản ghi Shop (PostgreSQL) + xóa cache danh sách shop.
3. `POST /api/layouts/{shopId}/seed` gieo bố cục mặc định (lũy đẳng, chỉ ghi tài liệu trống).
4. Bấm "Lưu và Hoàn tất" → điều hướng `/dashboard/{shopId}?finalizing=true` → **`FinalizingView`** poll tiến độ.
5. `BuildService.enqueueBuild(shopId)` đẩy job `build-shop` vào **Bull queue `shop-build`** (Redis).
6. **Worker `scripts/shop-builder`** (độc lập) chạy pipeline 4 stage (xem B6), cập nhật `%`/`stage` vào bảng `shop_build_jobs`.
7. Stage 04 ghi `publishedData` + đặt Shop = `PUBLISHED`. Storefront đọc `publishedData` và kết xuất.

→ Bổ sung vào Hình 2.5 (hoặc thêm 1 hình hoạt động) làn "Worker (shop-build queue)" giữa "API Core" và "Khách hàng": enqueue → pipeline 01→04 → PUBLISHED. Tham chiếu file: `apps/api-core/src/modules/build/`, `scripts/shop-builder/worker.ts`.

### B3. Wizard / Onboarding (UC-01 Bảng 2.2, UC-10 Phụ lục A.3, mục 5.3.3, 6.1)

Có **3 cơ chế "wizard"** khác nhau — đồ án đang gộp/nhầm:

1. **`create-shop`** (3 trang, xem B2) — luồng tạo shop.
2. **`SetupWizard`** ("Thiết lập chung" gateway, `apps/admin/src/components/builder/SetupWizard.tsx`)
   — **5 bước**: `brand` (Thương hiệu) → `colors` (Màu & Chữ) → `logo` (Logo & Favicon)
   → `social` (Liên hệ) → `headfoot` (Header & Footer). Cảm hứng luồng setup kiểu Haravan.
3. **Onboarding checklist** (dashboard, `apps/admin/src/app/dashboard/[shopId]/page.tsx`)
   — **6 bước** `step1..step6`:
   - `step1` Khởi tạo cửa hàng (Rocket)
   - `step2` Thêm sản phẩm (Package)
   - `step3` Tạo bộ sưu tập (Layers)
   - `step4` Tùy biến giao diện (Palette)
   - `step5` Cấu hình thanh toán (CreditCard)
   - `step6` Cấu hình vận chuyển (Truck)
   API: `GET /api/shops/:shopId/onboarding`, `PATCH /api/shops/:shopId/onboarding/complete/:step`.

**Sửa cụ thể:**
- UC-01 (Bảng 2.2) câu "chuyển sang trình hướng dẫn **tám bước** hoàn thiện cửa hàng"
  → **sáu bước**. Bằng chứng: test `apps/api-core/src/modules/shop/shop.service.spec.ts`
  ghi rõ *"step7 Verify Domain step removed"* → bước xác minh tên miền **đã bị gỡ** khỏi onboarding.
- UC-10 (Phụ lục A.3) câu "bước cuối trong **trình hướng dẫn tám bước**" → bỏ "tám bước".
  Ánh xạ tên miền **không còn là bước onboarding**; nó nằm ở **Settings → Domain**
  (`apps/admin/src/app/dashboard/[shopId]/settings/domain/`). Sửa hậu điều kiện UC-10
  "bước cuối của trình hướng dẫn khởi tạo được đánh dấu hoàn thành" cho khớp (không còn step domain).
- Mục 5.3.3 & 6.1 ghi "6 bước" — **đúng**, giữ nguyên.
- Cân nhắc thêm 1 đoạn mô tả `SetupWizard` 5 bước (gateway thu thập brand/màu/logo/liên hệ/header-footer) vào mục 2.3.2 hoặc 5.3.2, vì đây là phần "thiết lập chung" trước khi vào canvas kéo thả.

### B4. Agent AI (`design-agent`) — **viết một mục mới** (đề xuất: thêm vào Chương 3, 4 và 5)

Đồ án **không hề nhắc** đến app này dù nó là điểm nhấn "AI" của hệ thống. Nội dung đúng:

- **Vai trò:** trích xuất layout từ **Figma** → Claude map sang `ShopPageLayout` schema → upsert MongoDB; cộng thêm **RAG** + **chatbot** hỏi đáp về layout.
- **Pipeline trích xuất** (`apps/design-agent/src/extractor/`):
  `FigmaClient` (REST) → `NodeTreeReducer` (giữ text/font/color/imageRef) →
  `AssetPipeline` (tải ảnh fill → re-host lên **MinIO** `shop-layouts/_themes/<fileKey>/`, idempotent theo sha1) →
  `ClaudeExtractor` (**model `claude-sonnet-4-6`** + nạp prop-schema từng component) →
  `ComponentMapper` (đọc tĩnh `registry.ts` của ui-registry để đối chiếu componentId) →
  `MongoRepository` (collection `page_layouts`, upsert theo `figma_node_id`).
  *Không dùng structured output* vì `UIComponentRef` đệ quy — prompt lấy JSON rồi `ShopPageLayoutSchema.parse()`, retry tối đa 2 lần.
- **RAG** (`apps/design-agent/src/rag/`): embeddings **Voyage AI `voyage-3`** (`VOYAGE_API_KEY`);
  lệnh `build-index` / `rag-query` / `rag-eval`; lưu vector vào collection layout-embedding.
- **Chatbot** (`apps/design-agent/src/chatbot/`): **`claude-sonnet-4-6`** + RAG retrieval; lưu `conversations`.
- **Cách dùng & tích hợp:**
  - Chế độ CLI (nest-commander): `extract`, `promote-theme`, `build-index`, `rag-query`, `rag-eval`.
  - Chế độ `serve` (cổng **3100**): `POST /design-agent/chat`, `POST /design-agent/extract-theme`.
  - **api-core gọi sang** qua module **`theme-market`** (`theme-market.service.ts` → `POST {DESIGN_AGENT_URL}/design-agent/extract-theme`, server-to-server bằng `INTERNAL_API_KEY`) — đây là tính năng **"Import Figma từ web"** trong Admin (trang `dashboard/[shopId]/online-store/themes/market`).
- **Biến môi trường cần:** `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `FIGMA_TOKEN`, `MONGO_DB_ATLAS`, `MINIO_*`, `INTERNAL_API_KEY` (phải khớp api-core; thiếu → fail-fast lúc boot serve).
- **Quan trọng cho phần triển khai/chi phí:** `design-agent` **KHÔNG nằm trong CI/CD** (`ci-cd.yml` chỉ build 4 image: api-core, admin, storefront, shop-builder) và **KHÔNG có trong `deploy/docker-compose.prod.yaml`**. Có manifest `k8s/apps/design-agent.yaml` nhưng đường deploy rẻ không bật nó. ⇒ Ở môi trường prod rẻ **không phát sinh chi phí AI**; design-agent là công cụ dev/tùy chọn.

### B5. theme-market & chat (mục 6.2 và phần chức năng)

- **theme-market** (`apps/api-core/src/modules/theme-market/`): browse marketplace (chỉ theme `PUBLISHED`), apply theme, **`publishTheme`**, và import Figma qua design-agent — ghi `theme_templates`. Đồ án mục 6.2 xếp "chợ giao diện (template marketplace)" vào **hướng phát triển tương lai** với cờ `isCustom` — thực ra **đã có khung module hoạt động**. Sửa lại: marketplace **đã hiện thực một phần** (curate/publish/apply + import Figma), phần "tương lai" là mở cho nhà thiết kế bên thứ ba kinh doanh.
- **chat** (`apps/api-core/src/modules/chat/`): WebSocket gateway namespace `/chat`, schema Mongo `ChatSession`/`ChatMessage`. Đồ án không nhắc — cân nhắc bổ sung vào danh sách chức năng (chat realtime / hỗ trợ khách).

### B6. Benchmark THỰC TẾ — "1 shop dùng gì, tốn bao nhiêu, tài nguyên & thời gian chờ" (mục 2.4, 4.5, 4.5.1, 5.x "Kết quả đạt được")

Đây là phần người yêu cầu quan tâm nhất. **Thay toàn bộ mô tả k8s/NGINX/Cloudflare/Grafana
ở đường triển khai chính** bằng **đường deploy thật (rẻ)**, và mô tả tài nguyên + thời gian chờ.

**Hạ tầng thật (1 box phục vụ TẤT CẢ shop)** — nguồn: `deploy/DEPLOY.md`, `deploy/docker-compose.prod.yaml`, `deploy/Caddyfile`:

- **1 máy AWS Lightsail** Ubuntu 22.04, **2 GB RAM / 2 vCPU**, **~$12/tháng** (thường **free ~3 tháng đầu**), Static IP, **swap 3 GB** (chống OOM khi build job spike).
- **Docker Compose** (không build trên box — kéo image dựng sẵn từ **ghcr.io** do CI build).
- **Reverse proxy:** **Caddy** (Let's Encrypt tự động cho `api/admin/cdn/images/apex`, **on-demand TLS** cho subdomain tenant `*.<domain>`). Không dùng NGINX Ingress, không Cloudflare Tunnel ở đường này.
- **PostgreSQL = Supabase free** (`DATABASE_URL` pooler transaction-mode; `DIRECT_URL` :5432 cho migrate). Backup do Supabase quản lý (không phải CronJob 2h/3h sáng tự dựng).
- **MongoDB = Atlas free** (`MONGO_DB_ATLAS`).
- **Redis, MinIO, imgproxy = self-host trên box** (free).
- **Domain:** `tvgx1.id.vn` (id.vn là public suffix → cookie `Domain=.tvgx1.id.vn` chia sẻ giữa `admin.` ↔ `api.`).

**Giới hạn tài nguyên (mem limit) từng container** — `deploy/docker-compose.prod.yaml`
(sửa lại con số ở mục 2.4 và 4.5 cho khớp; đây là **trần**, không phải reservation):

| Service | Mem limit | Ghi chú |
|---------|-----------|---------|
| caddy | 100M | reverse proxy + TLS |
| api-core | **450M** | NestJS, **1 replica** |
| admin | 350M | Next.js SSR |
| storefront | 320M | Next.js standalone |
| shop-builder | 450M | worker, `SHOP_BUILD_CONCURRENCY=2` |
| minio | 300M | object storage |
| imgproxy | 150M | auto webp/avif |
| redis | 150M | `--maxmemory 128mb --maxmemory-policy noeviction` |

Tổng RAM lúc idle **~< 1.7 GB** (kiểm bằng `docker stats --no-stream`). → Câu "API 350MB,
Redis 512MB" trong đồ án **sai**, sửa thành bảng trên (api-core 450M, redis 128MB maxmemory).

**Chi phí biên cho mỗi shop tăng thêm:** vì mọi shop **dùng chung 1 box + Supabase/Atlas free**,
thêm 1 shop chỉ tốn **vài tài liệu JSON trong MongoDB Atlas + ảnh trong MinIO** ⇒ chi phí biên **≈ $0**.
Tổng chi phí nền tảng phục vụ nhiều shop ≈ **$12/tháng** (hoặc **$0** trong ~3 tháng free).
**Đây là số liệu thật cần dùng để thay cho phần so sánh chi phí** (xem B8).

**Thời gian chờ tính toán (build/publish shop)** — nguồn: `apps/api-core/src/modules/build/build.service.ts`, `scripts/shop-builder/`:

- Build/publish chạy **bất đồng bộ** qua Bull queue `shop-build` (job `build-shop`), **không chặn UI** (màn `FinalizingView` poll `%`).
- **Worker concurrency:** mặc định 4 (`worker.ts`), **prod đặt `SHOP_BUILD_CONCURRENCY=2`**.
- **Job options:** `attempts: 2`, `backoff` exponential `delay 5000ms`, `removeOnComplete 50`.
- **Ngưỡng "chết":** `STALE_BUILD_MS = 15 phút` — job không nhúc nhích tiến độ quá 15' bị đánh `FAILED` và enqueue lại (trần trên của thời gian chờ trước khi coi như hỏng).
- **Pipeline 4 stage** (đều tái dùng `LayoutService`):
  1. `01-data-extractor` → `extractDraft` (kéo Global + Page có nội dung từ MongoDB).
  2. `02-page-assembler` → `assembleLayout` (ghép Global Header/Footer với từng Page).
  3. `03-layout-compiler` → `compilePublished` (**materialize toàn bộ ảnh lên MinIO** `shop-layouts/<shopId>/pub-<sha1>`, idempotent — **đây là stage tốn thời gian nhất**, tỉ lệ với số ảnh).
  4. `04-storage-publisher` → ghi `publishedData` (Global + bulkWrite Pages), đặt Shop = `PUBLISHED`.
- **Tiến độ ghi vào bảng `shop_build_jobs`** (`status`, `percent`, `stage`, `createdAt`, `updatedAt`).
  ⇒ **Đo thời gian chờ thật** = `completedAt − createdAt` của mỗi shop trong bảng này (xem Phần C).

→ Viết lại mục 4.5 (Triển khai) và Hình 4.8 theo các dữ kiện trên; số đo cụ thể lấy theo Phần C.

### B7. Benchmark "hướng đi sau khi trả tiền" + CI/CD (mục 4.5, 6.2)

**CI/CD thật** — `.github/workflows/`:
- `ci-cd.yml` (trigger: push `main` / PR `main` / `workflow_dispatch`):
  - Job `lint-and-test`: Node **22.22.1**, `npm ci`, **`npm run prisma:generate`** (bắt buộc, nếu không tsc fail), `npm run check-types`, `npx turbo run build`.
  - Jobs build & push **4 image** lên **ghcr.io**: `-api-core`, `-storefront`, `-admin`, `-shop-builder` (chỉ khi push `main` hoặc dispatch). `NEXT_PUBLIC_*` bake lúc build từ repo Variables, fallback domain `tvgx1.id.vn`.
- Còn có `deploy-staging.yml`, `cli-build.yml`, `cli-deploy.yml`, `cli-monitoring.yml`, `prisma-validate.yml`.
→ Đồ án nên có một mục mô tả pipeline này (build sẵn image → box chỉ pull → tránh OOM khi build trên RAM 2GB).

**Đường nâng cấp khi trả tiền** (mô tả định tính, đối chiếu manifest `k8s/` đã chuẩn bị sẵn):
- Box lớn hơn / tách service (Lightsail lớn hơn, EC2, hoặc **Kubernetes** dùng `k8s/apps/*.yaml`).
- **Supabase Pro / Atlas dedicated**, **Redis quản lý** (Upstash / ElastiCache), thêm **CDN** trước MinIO.
- Bật **`design-agent`** kèm ngân sách **Claude API (`claude-sonnet-4-6`) + Voyage AI** (chi phí theo token).
- **Giám sát Grafana** (`k8s/monitoring/`, `k8s/infrastructure/monitoring.yaml`) + **CronJob backup** (`k8s/backup/`).
- **Sharding ngang:** hiện thực logic định tuyến cho **2 shard Postgres** (đã chuẩn bị trong docker-compose dev) — đồ án 6.2 ghi đúng là "chưa hiện thực", giữ nguyên nhưng nói rõ manifest k8s đã sẵn.

→ Khi viết "benchmark hướng trả phí", trình bày dưới dạng **kịch bản nâng cấp** kèm trục đo
(số shop tối đa/box, p95 cache hit/miss, RAM/shop, chi phí AI/shop) và **chỉ điền số khi đã đo**.

### B8. So sánh với sản phẩm tương tự (Bảng 2.1, mục 1.2, 6.1)

Cập nhật cột chi phí của ShopVolo v2 bằng **số thật**:

| Tiêu chí | Shopify | WooCommerce | Haravan | ShopVolo v2 (thực đo) |
|----------|---------|-------------|---------|----------------------|
| Mô hình | SaaS | Tự vận hành | SaaS | SaaS đa thuê bao |
| Chi phí | từ **$39/tháng/shop** | free core + **$10–100/tháng/shop** hosting (build custom >$8000) | **300k–1,5tr đ/tháng/shop** | **~$12/tháng cho 1 box phục vụ MỌI shop** (free ~3 tháng); **chi phí biên/shop ≈ $0** (vài JSON + ảnh) |
| Tùy biến | theme dựng sẵn | cần lập trình | hạn chế | kéo-thả từng khối + import Figma (AI) |
| Đa thuê bao | Có | Không | Không | Có (AsyncLocalStorage) |
| Thanh toán nội địa | hạn chế | qua plugin | Có | COD + chuyển khoản QR + ví nội bộ (VNPay/MoMo: mô phỏng) |
| Chi phí biên/shop | n/a | **cao** (mỗi shop 1 hạ tầng) | n/a | **rất thấp** (chung hạ tầng) |

Nhấn mạnh trong 6.1: điểm khác biệt định lượng là **cùng 1 box ~$12/tháng (hoặc free) phục vụ
nhiều shop**, trong khi Shopify/Haravan tính **theo từng shop**, WooCommerce mỗi shop một hạ tầng.
Giữ lưu ý của đồ án: so sánh **hiệu năng** chỉ có ý nghĩa sau khi đo trên prod thật (Phần C).

### B9. Các đính chính lặt vặt khác

- **4.5.1:** "dùng **cli-tool** sinh số lượng cửa hàng" → sai; `cli-tool` chỉ `sync:layout`/`watch:layout`.
  Sửa thành sinh shop qua script seed/API (hoặc nêu rõ công cụ thật khi đã có). Tải bằng **k6/autocannon** thì giữ.
- **2.4 / 4.5 backup:** thống nhất một mốc giờ và nói rõ ở đường rẻ backup Postgres = **Supabase-managed**; CronJob tự dựng chỉ áp dụng khi self-host Postgres trên k8s.
- **Bảng 4.2 "4 bộ sưu tập MongoDB":** chú thích "(nhóm layout storefront)"; liệt kê thêm collection của design-agent (`page_layouts`, `conversations`, layout-embeddings, `theme_templates`) và chat (`ChatSession`, `ChatMessage`) nếu muốn con số tổng.
- **3.9 / Bảng 3.1:** giữ Docker + Kubernetes nhưng nói rõ **đường deploy đang dùng = Docker Compose + Caddy** (Caddy chưa xuất hiện trong Bảng 3.1 — nên thêm), k8s là phương án mở rộng.

---

## Phần C — Số liệu PHẢI ĐO (không bịa) + cách lấy

| Chỉ số | Nguồn / cách đo |
|--------|-----------------|
| **Thời gian build/publish 1 shop** | Bảng `shop_build_jobs` (Postgres): `completedAt − createdAt`; cột `stage`/`percent` cho biết stage nào tốn nhất (kỳ vọng stage 03 materialize ảnh). Truy vấn Supabase hoặc Prisma Studio. |
| **RAM thực mỗi container** | Trên box prod: `docker stats --no-stream`. Ghi usage thật so với mem limit ở B6. |
| **Tổng RAM idle / dưới tải** | `docker stats` lúc idle (~<1.7GB) và khi bắn tải. |
| **Độ trễ p50/p95 (cache hit & miss)** | `k6` hoặc `autocannon` bắn vào nhiều subdomain tenant; tách 2 trường hợp trúng/trượt cache (định danh Redis TTL 300s; layout 60s; product 30s). |
| **RAM tăng thêm / shop** | Sinh N shop (100/1.000/5.000) rồi đo RAM api-core/redis/storefront → bộ nhớ tăng thêm trung bình. |
| **Chi phí AI (nếu bật design-agent)** | Token usage Claude (`claude-sonnet-4-6`) + Voyage (`voyage-3`) từ log/dashboard nhà cung cấp; quy ra $/lần import Figma. |
| **Build time CI** | Thời gian job `lint-and-test` + build image trong Actions; so cached vs uncached (turbo). |
| **Kích thước JS/trang storefront** | Bundle analyzer / output `next build` 1 trang storefront (đo hiệu quả `next/dynamic` import sâu). |

Điền các số này vào **Hình 4.8** và các câu "sẽ đo sau" ở Chương 4–5. Nếu chưa chạy được prod,
**giữ nguyên dạng "phương pháp đo"** và ghi rõ chưa có số liệu — tuyệt đối không chế.

---

## Phần D — Checklist nhãn LaTeX cần đụng tới

Tìm trong source (vd `docs/report/`) theo các mốc sau và sửa theo Phần B:

- [ ] **Tóm tắt / Abstract**: "bốn ứng dụng và năm gói" → **năm ứng dụng** (B1).
- [ ] **1.3 Định hướng giải pháp**: liệt kê 4 app → 5 app (+ design-agent, + worker) (B1).
- [ ] **Chương 3**: thêm mục **design-agent** (Claude `claude-sonnet-4-6` + Voyage `voyage-3`) (B4); thêm **Caddy** vào Bảng 3.1 (B9).
- [ ] **Bảng 3.1**: nói rõ deploy thật = Docker Compose + Caddy + Supabase/Atlas (B6, B9).
- [ ] **2.4 Yêu cầu phi chức năng**: sửa "API 350MB / Redis 512MB" → bảng mem limit thật; thống nhất giờ backup; nêu Supabase-managed backup (B6, B9).
- [ ] **Hình 2.5**: thêm làn Worker (shop-build queue) + 4 stage (B2).
- [ ] **Bảng 2.2 (UC-01)**: "tám bước" → **sáu bước** (B3).
- [ ] **Phụ lục A.3 (UC-10)**: bỏ "tám bước"; domain mapping ở Settings, không phải onboarding (B3).
- [ ] **Bảng 2.1**: cập nhật cột chi phí ShopVolo (B8).
- [ ] **4.1.1 + Bảng 4.2**: 20 → **23 module**; chú thích 4 collection (B1, B9).
- [ ] **4.1.2 Hình 4.1**: thêm `design-agent` + worker `shop-builder` vào sơ đồ gói (B1).
- [ ] **4.5 Triển khai**: viết lại theo Lightsail + Docker Compose + Caddy + Supabase/Atlas; bảng mem limit; mô tả Bull queue/timing; thêm mục CI/CD (B6, B7).
- [ ] **4.5.1 + Hình 4.8**: phương pháp đo đúng (bỏ "cli-tool sinh shop"); điền số thật hoặc giữ "chưa đo" (B6, B9, C).
- [ ] **Chương 5**: thêm/đề cập design-agent như đóng góp AI; phần "Kết quả đạt được" của 5.1–5.3 thay "sẽ đo" bằng số thật khi có (B4, C).
- [ ] **6.1 Kết luận**: "bốn ứng dụng" → năm; "46 thực thể" → **49**; nêu theme-market + chat đã có (B1, B5).
- [ ] **6.2 Hướng phát triển**: marketplace **đã có một phần** (không phải hoàn toàn tương lai); k8s/Grafana/sharding là đường nâng cấp trả phí (B5, B7).

---

### Phụ lục — lệnh tự kiểm chứng nhanh (chạy ở gốc repo)

```bash
ls apps/                                              # 5 app: admin api-core cli-tool design-agent storefront
ls apps/api-core/src/modules/ | wc -l                # 23
grep -rh "^model " packages/database/prisma/models/ | wc -l   # 49
grep -n "STEP_ICONS\|step6" apps/admin/src/app/dashboard/\[shopId\]/page.tsx   # 6 bước onboarding
grep -n "MODEL =" apps/design-agent/src/extractor/claude-extractor.service.ts  # claude-sonnet-4-6
grep -n "memory:" deploy/docker-compose.prod.yaml    # mem limit thật từng service
grep -n "STALE_BUILD_MS\|attempts\|backoff" apps/api-core/src/modules/build/build.service.ts
sed -n '1,20p' deploy/DEPLOY.md                      # Lightsail 2GB + Supabase/Atlas free
```
