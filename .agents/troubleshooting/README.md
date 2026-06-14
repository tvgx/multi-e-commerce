# Troubleshooting

Lỗi hay gặp & cách xử lý nhanh.

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|-------------|------------------------|-----------|
| UI trắng/không có data sau khi gọi API | Controller quên `BaseResponseDto.success()` | Bọc response đúng envelope |
| Jest vỡ trên WSL | Thiếu `@unrs/resolver-binding-linux-x64-gnu` | Cài lại `--no-save` sau reinstall |
| Build sai thứ tự / vỡ trên devbox | Import `@ecommerce/*` chưa khai báo `dependencies` | Thêm vào `dependencies`, sync loại trừ `dist/` |
| Prisma client lệch schema | Chưa `prisma generate` / quên thêm model vào `MODEL_FILES` | generate lại + cập nhật `build-prisma-schema.js` |
| "No API logs" khi publish | Store kẹt Fast Refresh | Hard-reload trang admin |
| 401/403 bất ngờ | Sai guard/role, thiếu `x-shop-id`, `credentials` | Kiểm guard + header tenant |
| Migrate lỗi pooler | Deploy qua transaction pooler | Dùng session pooler (5432) |

Sự cố prod → [escalation/support-levels.md](../escalation/support-levels.md).
