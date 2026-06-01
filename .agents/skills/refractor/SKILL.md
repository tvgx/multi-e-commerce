---
name: safe-refactor
description: >
  Refactor toàn bộ hoặc một phần codebase một cách an toàn — không gây lỗi mới.
  Bắt buộc agent phải lập bản đồ dependency TRƯỚC khi sửa, đồng bộ tất cả caller
  SAU khi sửa, và tự kiểm tra checklist trước khi kết thúc.
  
  Kích hoạt khi user nói: "refactor", "đổi tên", "tái cấu trúc", "clean up code",
  "di chuyển file", "tách module", "chuẩn hóa API", hoặc bất kỳ yêu cầu thay đổi
  cấu trúc code mà không thay đổi behavior.

license: MIT
compatibility: >
  Next.js / React frontend, Node.js / FastAPI backend, PostgreSQL multi-tenant.
  Tương thích Antigravity (Gemini Pro), Claude Code, Cursor, Codex.
---

# Safe Refactor Skill

Refactor mà không gây lỗi mới. Quy trình này bắt buộc — không được bỏ qua bước nào.

---

## NGUYÊN TẮC CỐT LÕI

> Agent không được sửa file nào trước khi hoàn thành Phase 1.
> Agent không được kết thúc task trước khi hoàn thành Phase 3.
> Nếu không đủ context để lập đầy đủ dependency map — hỏi user, đừng đoán.

---

## PHASE 1 — LẬP BẢN ĐỒ TRƯỚC KHI SỬA

Trước khi thay đổi bất kỳ dòng code nào, agent phải tạo một **Refactor Impact Map**:

### 1.1 Xác định tất cả điểm bị ảnh hưởng

Với mỗi file/function/type sẽ được thay đổi, liệt kê:

```
[TÊN CŨ] → [TÊN MỚI]
  Được import tại:   [danh sách file]
  Được gọi tại:      [danh sách file + dòng]
  Re-export tại:     [danh sách index/barrel file]
  Được test tại:     [danh sách test file]
  Được mock tại:     [nếu có]
```

### 1.2 Kiểm tra API contract (Backend ↔ Frontend)

Với mỗi API endpoint bị đổi (path, method, request body, response shape):

```
Endpoint cũ:     [METHOD /path]
Endpoint mới:    [METHOD /path-mới]
Caller frontend: [danh sách component/hook gọi endpoint này]
Nơi khai báo:    [router file]
Type/schema:     [Zod / Pydantic / TypeScript interface liên quan]
```

Nếu đổi response shape — liệt kê mọi nơi destructure hoặc access field đó.

### 1.3 Kiểm tra State & Props contract

Với mỗi prop/state bị đổi tên hoặc đổi kiểu:

```
Prop/State cũ:   [tên + type]
Prop/State mới:  [tên + type]
Được truyền từ:  [parent component]
Được dùng tại:   [child component, hook, selector]
Ảnh hưởng UI:   [mô tả ngắn]
```

### 1.4 Xác nhận với user

Trình bày Impact Map hoàn chỉnh và hỏi:
> "Tôi sẽ thay đổi N file, ảnh hưởng đến X caller. Xác nhận để tiếp tục?"

---

## PHASE 2 — THỰC HIỆN THEO THỨ TỰ AN TOÀN

Thực hiện theo đúng thứ tự này — không đảo lộn:

```
Bước 1: Đổi tên/sửa nơi ĐỊNH NGHĨA (type, function, component, endpoint)
Bước 2: Cập nhật tất cả file RE-EXPORT (index.ts, barrel files)
Bước 3: Cập nhật tất cả IMPORT trong caller
Bước 4: Cập nhật TYPE annotation liên quan (interface, Zod schema, Pydantic model)
Bước 5: Cập nhật TEST files
Bước 6: Cập nhật MOCK nếu có
```

### Quy tắc khi thực hiện

- **Không xóa logic cũ** cho đến khi đã xác nhận logic mới hoạt động đúng
- **Không dùng `any` hoặc `// @ts-ignore`** để "tạm thời" vá lỗi TypeScript
- **Nếu một file cần sửa quá 30 dòng** — dừng lại, báo cho user, chia thành bước nhỏ hơn
- **Barrel file (index.ts)** phải được cập nhật cùng lúc với file định nghĩa, không để sau

### Multi-tenant: Quy tắc bổ sung

- Mọi query/mutation liên quan đến tenant phải giữ `tenantId` trong scope sau refactor
- Không được merge hoặc flatten tenant-scoped data với global data
- Middleware xác thực tenant không được bị bỏ qua khi di chuyển route

---

## PHASE 3 — KIỂM TRA SAU KHI SỬA

Trước khi báo "xong", agent phải tự chạy checklist sau và báo cáo kết quả:

### Checklist Import/Export
- [ ] Không còn import nào trỏ đến đường dẫn cũ
- [ ] Không còn import nào bị `undefined` hoặc `cannot find module`
- [ ] Tất cả barrel file (index.ts) đã được cập nhật
- [ ] Không có circular import mới được tạo ra

### Checklist API Contract
- [ ] Mọi `fetch/axios/api call` ở frontend đã dùng đúng endpoint mới
- [ ] Request body / query params khớp với schema mới ở backend
- [ ] Response shape không bị truy cập bằng field đã xóa/đổi tên
- [ ] Không còn hardcode URL cũ trong code

### Checklist State & Props
- [ ] Mọi prop được truyền xuống đều khớp tên với nơi nhận
- [ ] Không còn prop nào được dùng nhưng không được khai báo trong type
- [ ] Zustand / Context store không còn field cũ được access sau khi đổi tên

### Checklist Logic Integrity
- [ ] Mọi logic đã di chuyển vẫn được gọi từ đúng nơi
- [ ] Không có function nào bị xóa mà vẫn còn được gọi ở nơi khác
- [ ] Error handling không bị mất trong quá trình di chuyển

### Checklist Multi-tenant
- [ ] `tenantId` vẫn được truyền đúng trong mọi DB query bị ảnh hưởng
- [ ] Row-level security / tenant filter không bị bỏ sót

---

## BÁO CÁO KẾT THÚC

Sau khi hoàn thành, agent phải xuất ra:

```
## Refactor Summary

### Đã thay đổi
- [N] file được sửa
- [N] import được cập nhật
- [N] API caller được đồng bộ

### Cần kiểm tra thủ công
- [Danh sách điểm agent không thể tự xác nhận — thường là runtime behavior]

### Rủi ro còn lại
- [Bất kỳ điểm nào agent không chắc chắn 100%]

### Không thay đổi (đã kiểm tra)
- [Danh sách file liên quan nhưng KHÔNG bị ảnh hưởng, để user yên tâm]
```

---

## LỖI THƯỜNG GẶP — VÀ CÁCH PHÒNG TRÁNH

| Lỗi | Nguyên nhân thực sự | Phòng tránh |
|-----|---------------------|-------------|
| `Cannot find module` | Barrel file chưa cập nhật | Bước 2 Phase 2 |
| `undefined is not a function` | Caller dùng tên cũ | Phase 1 impact map |
| `404 API` | Frontend còn gọi endpoint cũ | API contract checklist |
| `Missing prop` | Parent chưa truyền prop mới | Props checklist |
| `tenantId undefined` | Middleware bị bỏ qua | Multi-tenant checklist |
| Logic biến mất | Di chuyển nhưng không gọi lại | Logic integrity checklist |