# Standard Approval (thao tác HIGH)

Cho: batch >10 shop, template apply prod, apply manifest prod.

1. Chạy `--dry-run`, lưu output.
2. Tạo backup nếu thao tác có thể đổi dữ liệu.
3. Mở PR/issue nhãn `risk/high`, đính kèm dry-run + diff.
4. **1 approver** phù hợp (Ops Lead / Feature Lead / SRE+Tech Lead với manifest).
5. Thực hiện trong cửa sổ deploy → verify → ghi audit.

Thất bại → rollback ngay theo [infrastructure/rollback.md](../infrastructure/rollback.md).
