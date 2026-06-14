# Module: chat

Chat tư vấn giữa khách và shop, real-time qua **socket.io**; hội thoại/tin nhắn lưu trên **MongoDB**. Controller: [`chat.controller.ts`](../../apps/api-core/src/modules/chat/chat.controller.ts) — base `@Controller('chat')` → `/api/chat`. Auth: cả controller dùng `BetterAuthGuard`.

---

## `GET /api/chat/conversations` — query `PaginationDto`
Danh sách hội thoại của người dùng. Query chuẩn phân trang (`page`,`limit`,`sortBy`,`sortOrder`,`search`).

## `GET /api/chat/messages` — query `GetMessagesDto`
Tin nhắn trong 1 hội thoại.

| Field (query) | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `conversationId` | ✅ | string | Hội thoại cần xem |
| `page`,`limit`,... | ❌ | (pagination) | |

## `POST /api/chat/messages` — `SendMessageDto`
Gửi tin nhắn (tạo hội thoại mới nếu thiếu `conversationId`).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `content` | ✅ | string | Nội dung |
| `conversationId` | ❌ | string | Bỏ trống = tạo hội thoại mới |

---

**Response** bọc envelope. **Lỗi**: `1002` thiếu `content`/`conversationId` · `9998` token không hợp lệ.
