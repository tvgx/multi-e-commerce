# High-Risk Operations

Thao tác có thể mất dữ liệu / ảnh hưởng prod.

- [operations-matrix.md](operations-matrix.md) — phân loại mức & approval.
- [approval-workflow-standard.md](approval-workflow-standard.md) — quy trình HIGH (1 approver).
- [approval-workflow-critical.md](approval-workflow-critical.md) — quy trình CRITICAL (2 approver).
- [dry-run-procedures.md](dry-run-procedures.md) — xem trước an toàn.

Luật chung: **dry-run → backup → PR/issue nhãn `risk/high` → đủ approval → thực hiện → audit**. Không bao giờ chạy thẳng thao tác CRITICAL trên prod.
