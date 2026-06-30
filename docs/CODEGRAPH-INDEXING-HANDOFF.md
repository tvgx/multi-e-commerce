# Handoff: Bật CodeGraph indexing cho repo `multi-e-commerce`

> **Câu hỏi gốc:** "Dự án đã có indexing chưa? Nếu chưa thì viết handoff bổ sung."
> **Trả lời ngắn:** Repo **CHƯA** có CodeGraph index (không có thư mục `.codegraph/` ở gốc repo).
> Đây là handoff để bật. *(Lưu ý phân biệt: dự án vẫn có các loại "indexing" khác — xem mục cuối.)*

## 1. Hiện trạng

- `ls -la /home/lordfeeder/workspaces/multi-e-commerce/.codegraph` → **không tồn tại**.
- Trong phiên Claude Code, MCP server `codegraph` báo *"inactive (workspace not indexed)"* nên các tool
  `codegraph_explore` / `codegraph_node` **không khả dụng**, phải dùng grep/find/đọc file thủ công.
- Quy ước cá nhân (`~/.claude/CLAUDE.md`): khi repo có `.codegraph/`, **ưu tiên CodeGraph trước** grep/find.

## 2. Vì sao nên bật (lợi ích cho chính việc làm báo cáo)

- Đây là **monorepo lớn**: 5 app + 5 package + 23 module api-core, ~hàng trăm file `.ts/.tsx`.
- Việc rà soát để **giữ báo cáo đúng với code** (đếm module, lần theo luồng checkout/tenant/zero-file,
  liệt kê service/endpoint) lặp đi lặp lại — `codegraph_explore "<câu hỏi>"` trả về *mã nguồn liên quan +
  đường gọi* trong một lần, nhanh và đỡ sai hơn grep.
- Hữu ích về sau cho phát triển tính năng (tìm caller, hiểu DI giữa OrderService/ShippingService, v.v.).

## 3. Cách bật (an toàn, do chủ repo quyết định)

```bash
cd /home/lordfeeder/workspaces/multi-e-commerce
codegraph init        # tạo .codegraph/ và index toàn repo
# sau khi xong: MỞ MỘT PHIÊN Claude Code MỚI để MCP nạp index
```

Sau khi index xong và mở phiên mới:
- Shell: `codegraph explore "<symbol hoặc câu hỏi>"`, `codegraph node <symbol-hoặc-file>`.
- MCP (trong Claude Code): `codegraph_explore`, `codegraph_node` (nếu hiện ở dạng deferred thì nạp qua tool search).

**Gợi ý cấu hình:**
- Thêm `.codegraph/` vào `.gitignore` nếu không muốn commit index (index sinh lại được; là lựa chọn cá nhân).
- Re-index sau các đợt refactor lớn để tránh index lệch với code (đã từng có "code refractor" gần đây).

## 4. Phân biệt với các "indexing" KHÁC mà dự án ĐÃ có

Để tránh nhầm lẫn — dự án vẫn có sẵn các cơ chế index ở tầng dữ liệu/ứng dụng:

| Loại index | Trạng thái | Vị trí |
|---|---|---|
| **CodeGraph** (index *mã nguồn*) | **CHƯA có** (handoff này) | gốc repo |
| Tìm kiếm sản phẩm | Có — **Postgres trigram GIN** trên `name`, `description`, `sku` (ILIKE) | `packages/database/prisma/models/product.prisma`, migration `..._search_trgm_indexes` |
| RAG / vector index | Có — embedding **Voyage-3 (768d)** lưu MongoDB `layout_embeddings`, cosine trong app | `apps/design-agent/src/rag/*` |
| Index DB thông thường | Có đầy đủ — `@@index`/`@@unique` theo `shopId`, thời gian, trạng thái | `packages/database/prisma/models/*` |

> Nếu sau này muốn nâng tìm kiếm sản phẩm vượt quy mô (ILIKE+trigram không scale qua ~100k SP/shop),
> đó là một handoff *riêng* về Meilisearch/Typesense hoặc semantic search bằng pgvector — **không** thuộc
> phạm vi CodeGraph ở đây.
