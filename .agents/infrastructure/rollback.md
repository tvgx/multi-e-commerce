# Rollback & Recovery

Khi deploy lỗi:

1. **App**: rollback rollout — `kubectl rollout undo deployment/<app> -n <ns>` (về revision trước). Theo dõi pod healthy lại.
2. **Migration CSDL**: chạy SQL `down` đã chuẩn bị; nếu mất dữ liệu → [restore từ backup](../database/backup-restore.md) (CRITICAL, cần approval).
3. **Layout/config**: revert PR cấu hình.
4. Xác nhận health + smoke test xanh.
5. Ghi audit + mở post-mortem nếu là P1.

Nguyên tắc: rollback nhanh hơn debug tại chỗ trên prod — ưu tiên khôi phục dịch vụ trước, điều tra sau.
