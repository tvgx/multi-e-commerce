# Critical Approval (thao tác CRITICAL)

Cho: shop delete, restore prod, sync→prod, auto-fix prod.

1. **Dry-run** bắt buộc, lưu output (liệt kê dữ liệu bị ảnh hưởng).
2. **Backup** snapshot hiện trạng trước khi chạy.
3. Mở issue/PR nhãn `risk/critical`, mô tả lý do + impact + rollback plan.
4. **2 approver** (Platform Admin + Ops/SRE Lead); auto-fix prod tối thiểu 1 Admin.
5. Thực hiện với cờ `--force --reason "<ticket>" --approvers "..."` → verify → audit.
6. Nếu dùng `--force` ngoài giờ: cửa sổ review 6h, không duyệt → auto-rollback; post-mortem ≤24h.

Tuyệt đối không bỏ bước backup/dry-run với thao tác CRITICAL.
