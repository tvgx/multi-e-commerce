# Chương 1 — Giới thiệu đề tài

> Bản nháp nội dung (Markdown) để chuyển sang LaTeX theo [docs/report/guides.md](../guides.md). Viết bằng văn xuôi; phần trong ngoặc `[…]` là chỉ dẫn cho người viết.

## 1.1 Đặt vấn đề

Thương mại điện tử đã trở thành kênh bán hàng chủ đạo của các doanh nghiệp vừa và nhỏ cũng như cá nhân kinh doanh. Tuy nhiên, để sở hữu một gian hàng trực tuyến hoàn chỉnh, người bán thường phải lựa chọn giữa hai thái cực: hoặc thuê đội ngũ phát triển xây dựng website riêng với chi phí và thời gian lớn, hoặc chấp nhận các nền tảng dựng sẵn với khả năng tùy biến giao diện hạn chế. Bài toán đặt ra là làm thế nào để một người bán không có kiến thức lập trình vẫn có thể tự tạo, tự thiết kế và vận hành một gian hàng riêng biệt về thương hiệu, đồng thời nền tảng phải phục vụ được hàng nghìn gian hàng trên cùng một hệ thống mà không phải viết mã riêng cho từng gian hàng. Giải quyết tốt bài toán này mang lại lợi ích kép: người bán rút ngắn thời gian ra mắt và giảm chi phí, còn nhà cung cấp nền tảng tối ưu được hạ tầng và chi phí vận hành.

## 1.2 Mục tiêu và phạm vi

[Tổng quan các sản phẩm hiện có và so sánh.] Trên thị trường đã có các nền tảng như Shopify, WooCommerce hay Haravan cho phép tạo gian hàng nhanh. Điểm hạn chế chung là chi phí theo tháng, mức độ tùy biến giao diện bị ràng buộc bởi theme, và khả năng kiểm soát dữ liệu của người bán không cao. [Chèn bảng so sánh ưu/nhược điểm.]

Đề tài xây dựng một nền tảng SaaS đa gian hàng (multi-tenant) cho phép người bán tự tạo gian hàng, tự thiết kế giao diện bằng công cụ kéo–thả trực quan, quản lý sản phẩm và đơn hàng, trong khi người mua duyệt và đặt hàng trên giao diện được kết xuất động. Phạm vi chức năng chính gồm: (i) khởi tạo và cấu hình gian hàng, (ii) thiết kế và xuất bản giao diện, (iii) quản lý sản phẩm và danh mục, (iv) mua hàng và thanh toán, (v) quản lý đơn hàng; cùng các chức năng hỗ trợ như khuyến mãi, vận chuyển, phân tích, ví, chat và thông báo.

## 1.3 Định hướng giải pháp

Giải pháp được xây dựng theo kiến trúc **Zero-File**: thay vì sinh mã giao diện cho từng gian hàng, hệ thống mô tả giao diện bằng cấu trúc dữ liệu JSON. Một bộ khung mặc định (Master Template) kết hợp với phần ghi đè của từng gian hàng (Tenant Layout) tạo nên giao diện cuối cùng; ứng dụng storefront nhận định danh gian hàng, lấy cấu hình JSON qua API và dùng bộ phân giải thành phần (Dynamic Component Resolver) để kết xuất. Về công nghệ, hệ thống dùng NestJS cho backend, Prisma trên PostgreSQL cho dữ liệu nghiệp vụ và Mongoose trên MongoDB cho cấu hình giao diện linh hoạt, Next.js cho cả trang quản trị lẫn storefront, hàng đợi Bull/Redis cho các tác vụ nền (dựng và xuất bản gian hàng, gửi email, xử lý thanh toán), và MinIO để lưu trữ hình ảnh. Đóng góp chính của đề tài là mô hình kết xuất giao diện động cô lập theo từng tenant cùng quy trình thiết kế–xuất bản gian hàng chạy nền, cho phép một mã nguồn phục vụ nhiều gian hàng. [Nêu kết quả dự kiến: số module, số gian hàng demo, các luồng đã chạy.]

## 1.4 Bố cục đồ án

Chương 2 trình bày khảo sát hiện trạng và phân tích yêu cầu, đặc tả các use-case chính. Chương 3 phân tích các công nghệ sử dụng và lý do lựa chọn. Chương 4 mô tả thiết kế kiến trúc, thiết kế chi tiết, cơ sở dữ liệu, xây dựng, kiểm thử và triển khai hệ thống. Chương 5 trình bày các giải pháp và đóng góp nổi bật. Chương 6 kết luận và nêu hướng phát triển.
