# TÙY CHỈNH KIẾN TRÚC UI BUILDER (HỆ THỐNG DESIGN PAGE)

Kế thừa `project.md`, file quy định nguyên tắc chuẩn mực cho Luồng Build Giao Diện Tự Do (Design Page) theo cấu trúc Zero-File.

## 1. DND-KIT BOUNDARY STRICT RULES
- **Event Handling**: Mọi tác vụ kéo thả (Drag and Drop) từ `@dnd-kit` phải được bọc trong `SortableContext` khép kín. Việc cập nhật Position/Order phải dựa trên UUID duy nhất sinh ra lúc runtime, ngặt nghèo cấm dùng `index` của React Array.
- **Bundle Tránh Rác**: Không render nặng nề khi kéo thả, áp dụng `memo` hoặc `useMemo` của React để cache UI Element lúc kéo (DragOverlay).

## 2. THE UI REGISTRY DOCTRINE
- **No Storefront Components**: Admin App (Design Page) không được phép import components trực tiếp từ Storefront.
- **Package Flow**: Bất cứ block nào hiện được trên Canvas, nó phải nằm ở `packages/ui-registry/src/components`. Code Storefront cũng đồng thời phải lấy từ package này.

## 3. ZERO-FILE SCHEMA SYNC
- Render Output của Canvas Builder KHÔNG tạo ra file code (`.tsx`). 
- Nó phải tạo ra một Cấu Trúc Data (Object Tree) tuân thủ bộ quy định Zod Schema mới thiết kế dưới `packages/schema`.
- Dấu Format phải quy đổi thông số ra các thuộc tính hỗ trợ `MasterTemplate` và `TenantLayout` (đang có ở `api-core`).
- Nếu người dùng chọn KHÔNG tuỳ chỉnh các trang khác, script sẽ móc màu/theme parameters truyền qua Payload cho Endpoint Layout.

## 4. HYBRID MOCK DATA
- Toàn bộ data tĩnh để phục vụ Render View/Preview cho App Admin phải đặt tập trung ở `apps/admin/src/lib/constants/mock-data.ts`. Cấm tạo mock rác bên trong các components UI.
