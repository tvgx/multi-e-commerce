# Chương 5 — Giải pháp & đóng góp nổi bật

> Chương đánh giá chính của hội đồng. Mỗi đóng góp = một mục: (i) dẫn dắt vấn đề, (ii) giải pháp kỹ thuật, (iii) kết quả. Nội dung đã nêu ở Ch.1–4 chỉ tóm lược + dẫn "Chi tiết xem §…".

## 5.1 Kết xuất giao diện động đa tenant (Zero-File Engine)
- **Vấn đề**: phục vụ hàng nghìn gian hàng, mỗi gian hàng giao diện riêng, nhưng không thể sinh và triển khai mã nguồn cho từng gian hàng (chi phí build/triển khai bùng nổ).
- **Giải pháp**: mô tả giao diện bằng JSON; bộ khung Master Template kết hợp **deep-merge** với phần ghi đè Tenant Layout tạo cấu hình cuối; storefront dùng Dynamic Component Resolver ánh xạ `componentType` → component trong `packages/ui-registry` để kết xuất. Chỉ lưu phần ghi đè của tenant nhằm tối ưu lưu trữ; kết quả merge được cache trên Redis và vô hiệu hóa khi xuất bản.
- **Kết quả**: một mã nguồn storefront phục vụ mọi gian hàng; thêm gian hàng chỉ là thêm bản ghi cấu hình JSON, không cần viết hay triển khai thêm mã. Các số liệu định lượng (thời gian kết xuất, kích thước payload JSON, tỉ lệ cache hit) cần đo bằng kiểm thử tải và được đặt trong hướng phát triển (§6.2).

## 5.2 Quy trình thiết kế–xuất bản gian hàng chạy nền
- **Vấn đề**: dựng và xuất bản một gian hàng là tác vụ nặng (seed trang, biên dịch cấu hình), không nên chặn luồng request của người dùng.
- **Giải pháp**: tách `draftData`/`publishedData`; thao tác xuất bản đẩy job vào hàng đợi Bull `shop-build` xử lý bởi worker độc lập, đồng thời chuyển trạng thái gian hàng DRAFT → PUBLISHED; phía admin theo dõi tiến trình bằng cơ chế poll (`build-status`). Cho phép xuất bản từng trang phục vụ wizard thiết kế theo bước.
- **Kết quả**: trải nghiệm tạo gian hàng mượt, tách biệt rõ tác vụ nền khỏi API. (Chi tiết kiến trúc hàng đợi xem §4.1, §4.2.2.)

## 5.3 Kiến trúc dữ liệu lai PostgreSQL + MongoDB
- **Vấn đề**: dữ liệu nghiệp vụ cần quan hệ chặt và toàn vẹn, trong khi cấu hình giao diện cần linh hoạt, thay đổi liên tục.
- **Giải pháp**: dùng PostgreSQL (Prisma) cho dữ liệu có cấu trúc và MongoDB (Mongoose) cho cấu hình giao diện/chat; schema Prisma tách theo domain và ghép tự động, migration viết tay phù hợp hạ tầng pooler.
- **Kết quả**: tận dụng thế mạnh của từng loại CSDL; mô hình giao diện tiến hóa không phá vỡ schema quan hệ. (Chi tiết §4.2.3.)

## 5.4 Cô lập đa tenant xuyên suốt
- **Vấn đề**: nhiều gian hàng trên cùng hệ thống, tuyệt đối không để gian hàng này truy cập dữ liệu gian hàng khác.
- **Giải pháp**: gắn `shopId` xuyên suốt qua tenant context/header `x-shop-id`; guard và service kiểm soát phạm vi; phân tách rõ xác thực người bán (better-auth, role OWNER/ADMIN) và người mua (storefront-auth).
- **Kết quả**: dữ liệu cô lập theo tenant ở mọi tầng. (Chi tiết §4.1, [security/access-control](../../../.agents/security/access-control.md).)

> [Nếu Chương 5 < 5 trang, cân nhắc gộp vào Chương 6 theo hướng dẫn.] Có thể bổ sung: chuẩn hóa response `BaseResponseDto`, hệ thống i18n, hoặc phễu phân tích (analytics) như đóng góp phụ.
