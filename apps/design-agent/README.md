# design-agent

Trích xuất layout trang từ file Figma, dùng Claude map mỗi top-level frame sang
layout schema của storefront, rồi upsert kết quả vào MongoDB. Đây là khối đầu
tiên của design-agent lớn hơn (RAG + chatbot hỏi đáp về layout).

## Pipeline

```
Figma REST file ─► NodeTreeReducer ─► AssetPipeline ─► ClaudeExtractor ─► ComponentMapper ─► MongoRepository
 (FigmaClient)      (giữ text/font/     (ảnh fill →       (sonnet-4-6 +        (đối chiếu id      (upsert theo
                     color/imageRef)     MinIO URL bền)    prop-schema)         với UI registry)   figma_node_id)
```

- **Schema đích là `ShopPageLayout` của `@ecommerce/schema`** — kết quả trích xuất
  render được ngay trên storefront. `FigmaPageExtractionSchema` chỉ là lớp bọc
  mỏng thêm metadata Figma (`figma_node_id`, `figma_version`, `tenant_id`, …).
- **Trích xuất bám sát thiết kế bằng section có sẵn.** Reducer giữ thêm text,
  font, màu nền (SOLID fill → hex) và `imageRef` (IMAGE fill); `AssetPipeline`
  tải ảnh fill từ Figma rồi up vào MinIO (`shop-layouts/_themes/<fileKey>/`,
  idempotent theo sha1) trả về **URL bền**; prompt Claude được nạp thêm
  prop-schema từng component (đọc `component-schemas.ts`) + map ảnh để điền đúng
  prop (`backgroundImageUrl`/`logoUrl`/…). Không pixel-perfect — chọn section gần
  nhất rồi điền props.
- **Không dùng structured outputs.** `UIComponentRef` đệ quy (`blocks[]`), mà
  `output_config.format` của Claude không nhận schema đệ quy — nên ta prompt lấy
  JSON rồi validate bằng `ShopPageLayoutSchema.parse()`, retry tối đa 2 lần, lỗi
  cuối cùng thì ghi raw response vào `logs/`.
- **Đối chiếu component-id bằng cách đọc tĩnh `registry.ts` của `ui-registry`.**
  `registry` lúc runtime kéo theo React/Next/CSS, không import được vào Node CLI
  (api-core cũng né), nên mapper parse source của registry để lấy danh sách id
  hợp lệ và đối chiếu thêm với blueprint trong master-templates.

---

## Hướng dẫn chạy

### 1. Yêu cầu trước khi chạy

| Thứ cần có | Ghi chú |
|------------|---------|
| **Node 22** | Cả monorepo chốt Node 22 (`.nvmrc`). Chạy `nvm use` ở thư mục gốc. |
| **MongoDB** | Đang chạy và truy cập được qua `MONGO_DB_ATLAS` (dev local: `docker compose` / `npm run dev:loop`, cổng 27017). |
| **Figma token + file key** | Token cá nhân Figma (Settings → Security → Personal access tokens) và file key. |
| **Anthropic API key** | Key gọi Claude API. |
| **Đã build các package phụ thuộc** | `@ecommerce/schema` và `@ecommerce/master-templates` được import qua `dist` lúc runtime — **phải build trước** (xem bước 3). |

> **Lấy `FIGMA_FILE_KEY` ở đâu?** Từ URL file:
> `https://www.figma.com/file/<FILE_KEY>/<tên-file>` — phần `<FILE_KEY>` chính là
> giá trị cần dùng.

### 2. Cài dependency

Chạy ở **thư mục gốc monorepo** (npm workspaces sẽ cài cho cả app mới):

```bash
npm install
```

> **WSL:** nếu jest lỗi thiếu native binding, cài lại không lưu lockfile:
> `npm install @unrs/resolver-binding-linux-x64-gnu --no-save`

### 3. Build các package phụ thuộc (bắt buộc lần đầu)

`design-agent` import `@ecommerce/schema` và `@ecommerce/master-templates` qua bản
build `dist`. Chạy một lần (và mỗi khi sửa 2 package này):

```bash
# từ thư mục gốc
npm run build --workspace=@ecommerce/schema
npm run build --workspace=@ecommerce/master-templates

# hoặc build cả monorepo theo đúng thứ tự turbo
npm run build
```

> `@ecommerce/ui-registry` thì **không** cần build — mapper đọc thẳng file
> `registry.ts` ở dạng source.

### 4. Cấu hình `.env` (ở thư mục gốc, dùng chung với api-core)

```dotenv
FIGMA_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIGMA_FILE_KEY=AbCdEf123456            # tuỳ chọn — có thể truyền --file-key thay thế
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
MONGO_DB_ATLAS=mongodb://localhost:27017/ecommerce
VOYAGE_API_KEY=pa-xxxxxxxxxxxx          # chỉ cần cho RAG (build-index / rag-query / rag-eval)
# VOYAGE_MODEL=voyage-3                 # tuỳ chọn, mặc định voyage-3

# MinIO — để AssetPipeline re-host ảnh fill (dùng chung cấu hình với api-core)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
# CDN_BASE_URL=http://localhost:9000    # tuỳ chọn; mặc định = http://MINIO_ENDPOINT:MINIO_PORT
```

### 5. Chạy thử (dry-run — không ghi DB)

Luôn chạy `--dry-run` trước để xem JSON Claude trả về mà không đụng MongoDB:

```bash
# từ thư mục gốc
npm run design-agent -- --file-key=AbCdEf123456 --dry-run

# hoặc từ trong package này (apps/design-agent)
npm run extract -- --file-key=AbCdEf123456 --dry-run
```

Nếu đã đặt `FIGMA_FILE_KEY` trong `.env` thì bỏ luôn `--file-key`:

```bash
npm run design-agent -- --dry-run
```

### 6. Chạy thật (ghi vào MongoDB)

Bỏ `--dry-run`; mỗi top-level frame → một document trong collection
`page_layouts`, upsert theo `figma_node_id`:

```bash
# không multi-tenant
npm run design-agent -- --file-key=AbCdEf123456

# gắn tenant
npm run design-agent -- --file-key=AbCdEf123456 --tenant=shop_1

# tắt ảnh render frame nếu muốn tiết kiệm token (mặc định đã bật)
npm run design-agent -- --file-key=AbCdEf123456 --no-images
```

### 7. Các option của lệnh `extract`

| Option | Ý nghĩa |
|--------|---------|
| `--file-key <key>` | File key Figma. Không truyền thì lấy `FIGMA_FILE_KEY` trong `.env`. |
| `--tenant <id>` | Gắn `tenant_id` cho bản ghi (đa tenant). Bỏ trống = `null` (dùng chung). |
| `--dry-run` | In JSON ra stdout, **không** ghi MongoDB (vẫn có thể re-host ảnh lên MinIO). |
| `--no-images` | **Tắt** việc đính ảnh render frame vào prompt (mặc định bật để bám sát thiết kế). |

Xem trợ giúp:

```bash
npm run design-agent -- --help
```

### 8. Kiểm tra kết quả trong MongoDB

```bash
# ví dụ với mongosh
mongosh "$MONGO_DB_ATLAS" --eval 'db.page_layouts.find({}, {figma_node_id:1, name:1, "page.pageType":1}).pretty()'
```

Chạy lại cùng file → các document được **cập nhật** (không nhân bản) nhờ unique
index trên `figma_node_id`.

---

## Theme Market (curate → apply)

Sau khi extract, admin biến các bản trích xuất thành **theme dùng chung** cho
người dùng chọn-và-áp-dụng. Lệnh `promote-theme` đọc `page_layouts`, chuyển sang
định dạng editor (`convertExtractionsToTheme` của `@ecommerce/schema`: tách
Header/Footer/AnnouncementBar ra `globalComponents`, gom còn lại theo `pageType`)
rồi upsert vào collection **`theme_templates`**.

```bash
# gom theo tenant (hoặc bỏ --tenant để lấy phần dùng chung tenant_id=null)
npm run promote-theme -- --theme-id=minimal-fashion --title="Minimal Fashion" \
  --category=fashion --tenant=shop_1

# hoặc chỉ định đúng các frame, và publish luôn ra market
npm run promote-theme -- --theme-id=tech-store --title="Tech Store" \
  --node-ids=1:23,1:88 --publish
```

- **Ảnh** trong theme là URL MinIO bền do AssetPipeline tạo lúc extract; theme
  **không** lưu bytes ảnh, chỉ lưu URL (an toàn dưới giới hạn 16MB/doc Atlas).
- **Áp dụng:** admin mở *Chợ giao diện* (`/dashboard/<shopId>/online-store/themes/market`)
  → `POST /api/themes/:themeId/apply/:shopId` (api-core) ghi theme vào
  `GlobalLayout.draftData` + `PageLayout.draftData` của shop **(chỉ bản nháp)** rồi
  điều hướng sang builder. Khi shop publish, `LayoutService` tự materialize ảnh
  URL vào bucket riêng của shop.
- `PATCH /api/themes/:themeId/publish` (ADMIN) để duyệt theme draft → published.

---

## RAG (chunk → embed → retrieve)

Sau khi extractor đổ layout vào `page_layouts`, lớp RAG ở [src/rag/](src/rag/) băm
mỗi **section** thành một chunk, embed bằng Voyage AI rồi cho chatbot truy vấn.

```
page_layouts ──► LayoutChunkerService ──► EmbeddingService ──► layout_embeddings ──► RagRetrievalService
 (1 page/doc)     (1 section = 1 chunk)    (Voyage voyage-3)     (vector lưu inline)    (lọc tenant + cosine, top-k)
```

- **Mỗi top-level component trong `page.components` = 1 chunk.** Văn bản chunk theo
  template cố định: `Tenant … Page … Section … Components … UI Registry refs …`,
  kèm metadata `page_id / section_id / tenant_id / figma_node_id / page_name /
  section_name`.
- **Embedding: Voyage AI `voyage-3`** (`VOYAGE_API_KEY`). api-core chưa có module
  embedding để dùng lại nên đây là nguồn embedding duy nhất; Voyage không có SDK
  Node nên gọi REST bằng `fetch`. Index lúc build dùng `input_type: document`,
  query lúc truy vấn dùng `input_type: query`.
- **MongoDB self-hosted (`mongo:6`) → không có Vector Search.** Vector lưu thẳng
  trong `layout_embeddings`, tính **cosine similarity ở app layer** ([similarity.ts](src/rag/similarity.ts)).
  Đúng và rẻ cho corpus nhỏ mỗi tenant; muốn scale thì đổi sang Atlas Vector
  Search / Qdrant phía sau cùng interface `RagRetrievalService`.
- **Idempotent.** Mỗi chunk có `content_hash`; build lại chỉ embed phần đổi, bỏ
  qua phần trùng (không gọi Voyage), và xoá section đã biến mất khỏi page.
- **Tự động chạy sau extract.** Lệnh `extract` (không `--dry-run`) sẽ refresh index
  cho tenant vừa trích xuất — best-effort, thiếu `VOYAGE_API_KEY` chỉ cảnh báo chứ
  không làm hỏng extraction. Dùng `--skip-index` để tắt.

### Build index

```bash
# cần VOYAGE_API_KEY trong .env
npm run build-index                 # toàn bộ page_layouts
npm run build-index -- --tenant=shop_1
```

### Truy vấn thử (smoke-test cho RagRetrievalService)

```bash
npm run rag-query -- "hero section on the home page"
npm run rag-query -- "footer with company links" --tenant=shop_1 --k=5
```

`RagRetrievalService.retrieveContext(query, { tenant_id?, k? })` là entrypoint cho
chatbot: lọc cứng theo `tenant_id` (cô lập đa tenant) rồi xếp hạng theo cosine,
trả top-k chunk + metadata + score.

### Đánh giá (recall@5 / precision@5)

[test/rag-eval/test_cases.json](test/rag-eval/test_cases.json) chứa câu hỏi mẫu +
`expected_section_ids` (ground truth). Các id mẫu mô phỏng blueprint
master-templates — **sửa lại cho khớp `section_id` thật** mà extractor sinh ra
trước khi tin con số.

```bash
npm run rag-eval            # k=5
npm run rag-eval -- --k=3
```

> Env bổ sung cho RAG: `VOYAGE_API_KEY` (bắt buộc để embed/query), tuỳ chọn
> `VOYAGE_MODEL` (mặc định `voyage-3`).

---

## Chatbot (`POST /design-agent/chat`)

Trợ lý hỏi-đáp về cấu trúc layout của từng tenant: **RAG (Prompt 2) + Claude
`claude-sonnet-4-6` + tool-calling** nối thẳng MongoDB / ui-registry / master-templates.

```
chat ──> load 10 msg gần nhất (design_agent_conversations, theo tenant)
     ──> RagRetrievalService.retrieveContext(message, {tenant_id})   ← context
     ──> system prompt (role + LUẬT cô lập tenant + context + tools)
     ──> Claude messages+tools ──(tool_use)──> backend execute ──> tool_result ──┐
                         ▲────────────────── lặp tối đa 6 vòng ───────────────────┘
     ──> lưu user + assistant vào design_agent_conversations
```

**Tools** (`src/chatbot/tools/`):

| Tool | Làm gì |
|------|--------|
| `get_page_layout(tenant_id, page_path)` | Trả full document `page_layouts` (khớp slug / pageType / name) |
| `get_section_components(tenant_id, page_path, section_name)` | Component list của 1 section |
| `search_pages(tenant_id, keyword)` | Text search page theo name/slug/pageType |
| `get_component_registry_info(component_name)` | Đọc thật `@ecommerce/ui-registry` → category + prop fields (chống bịa) |
| `get_master_template(industry)` | Blueprint chuẩn theo ngành để so với layout hiện tại |

**Cô lập tenant — 2 lớp, không tin prompt:**

1. **Tool executor** (`tool-executor.service.ts`) luôn scope mọi query MongoDB theo
   `tenantId` của **request đã xác thực**, và **từ chối** mọi `tenant_id` model truyền
   vào khác với session (`tenant_isolation_violation`). Model không thể tự mở rộng phạm vi.
2. **Guard** (`SessionAuthGuard`) uỷ quyền cho api-core `/auth/verify-session` (forward
   cookie) — không kéo better-auth/Prisma vào service. Nếu api-core trả `shopIds`, guard
   chặn luôn `tenant_id` không thuộc user. Local/eval: đặt `DESIGN_AGENT_AUTH_DISABLED=true`.

**Bộ nhớ hội thoại:** collection `design_agent_conversations`
(`{conversation_id, tenant_id, messages:[{role, content, timestamp}]}`), nạp lại 10 message
gần nhất (`HISTORY_WINDOW`), tra cứu luôn theo cả `conversation_id` + `tenant_id`.

```bash
# chạy HTTP server (cần ANTHROPIC_API_KEY + VOYAGE_API_KEY + Mongo có dữ liệu)
npm run serve                 # lắng nghe :3100, POST /design-agent/chat

# đánh giá LLM-as-judge (chấm 1-5: accuracy / tenant_isolation / tool_use)
npm run chat-eval             # judge mặc định claude-opus-4-8 (đổi qua JUDGE_MODEL)
```

Body: `{ "message", "conversation_id", "tenant_id" }`. Eval cases (gồm cả case
cross-tenant phải bị từ chối) ở `test/chatbot-eval/test_conversations.json`.

> Env bổ sung cho chatbot: `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY` (RAG), tuỳ chọn
> `API_CORE_URL` (mặc định `http://localhost:3000`), `DESIGN_AGENT_PORT` (3100),
> `DESIGN_AGENT_AUTH_DISABLED`, `JUDGE_MODEL`.

Deploy: `apps/design-agent/Dockerfile` (multi-stage turbo-prune, `CMD … serve`),
k8s `k8s/apps/design-agent.yaml`, Postman `postman/design-agent.postman_collection.json`.

---

## Test

```bash
# từ trong apps/design-agent
npm test         # unit test: reducer + schema-validation + chunker + cosine + tenant-isolation (27 test)
```

---

## Xử lý sự cố

| Triệu chứng | Nguyên nhân & cách xử lý |
|-------------|--------------------------|
| `Parameter decorators only work when experimental decorators are enabled` | App **phải chạy bằng `ts-node`, không phải `tsx`** (esbuild không phát decorator metadata nên NestJS DI hỏng). Script đã dùng `ts-node` — đừng đổi sang `tsx`. |
| `Module '@ecommerce/schema' has no exported member 'FigmaPageExtractionSchema'` | Chưa build `@ecommerce/schema`. Chạy lại bước 3. |
| `Could not load @ecommerce/master-templates` (warning) | Chưa build master-templates — phần đối chiếu blueprint bị bỏ qua, vẫn chạy được. Build để bật lại. |
| Treo / `MongooseServerSelectionError` lúc khởi động | MongoDB chưa chạy hoặc `MONGO_DB_ATLAS` sai. App connect Mongo ngay khi bootstrap. |
| `FIGMA_TOKEN is not set` | Thiếu `FIGMA_TOKEN` trong `.env`. |
| Figma trả `403` | Token hết hạn/không có quyền truy cập file đó. |
| Lỗi auth khi gọi Claude | Thiếu/sai `ANTHROPIC_API_KEY`. Key chỉ được yêu cầu khi thực sự gọi model (kể cả `--dry-run`). |
| `Failed to extract a valid layout … Raw response logged to logs/…` | Claude trả JSON không hợp schema sau 3 lần thử. Mở file raw trong `logs/` để xem model trả gì rồi chỉnh prompt/registry. |
| Mapper log `Unknown componentId "X" — Review manually` | Tên component Figma chưa map được sang registry. Thêm vào bảng `ALIASES` trong `component-mapper.service.ts` nếu là tên đồng nghĩa. |
| `VOYAGE_API_KEY is not set` khi `build-index`/`rag-query` | Thiếu `VOYAGE_API_KEY` trong `.env`. (Extract vẫn chạy được; chỉ phần refresh index bị bỏ qua kèm cảnh báo.) |
| `rag-query`/`rag-eval` trả rỗng | Chưa build index, hoặc lọc sai `--tenant`. Chạy `build-index` trước; bỏ `--tenant` để tìm xuyên tenant. |
| `Vector length mismatch` khi truy vấn | Index lẫn vector từ 2 model khác nhau. Giữ một `VOYAGE_MODEL` rồi `build-index` lại để re-embed đồng nhất. |
| `POST /design-agent/chat` trả `401 Invalid or expired session` | Guard uỷ quyền api-core `/auth/verify-session` thất bại. Đăng nhập owner trước (cookie), chỉnh `API_CORE_URL`, hoặc đặt `DESIGN_AGENT_AUTH_DISABLED=true` khi test local. |
| Chatbot trả `tenant_isolation_violation` | Model thử truy cập tenant khác session — đúng thiết kế, dữ liệu bị chặn. Đổi `tenant_id` trong body cho đúng. |
| `chat-eval` lỗi auth khi gọi Claude | Thiếu `ANTHROPIC_API_KEY` (chatbot + judge) hoặc `VOYAGE_API_KEY` (RAG). Cả hai phải có trong `.env`. |
| Chatbot không thấy page nào | Chưa `extract` + `build-index` cho tenant đó, hoặc `tenant_id` không khớp dữ liệu trong `page_layouts`. |
