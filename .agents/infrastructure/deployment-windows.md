# Deployment Windows

- Cửa sổ deploy prod: **09:00–17:00 UTC, T2–T6**. Tránh cuối tuần/ngoài giờ (khó ứng cứu).
- Ngoài cửa sổ: chỉ khẩn cấp (P1) qua Emergency Override — `--force --reason "P1-<ticket>"` → auto-escalate SRE, review 6h, không duyệt thì auto-rollback, post-mortem ≤24h.
- Tránh deploy lớn sát cuối cửa sổ (chừa thời gian theo dõi/rollback).
- Staging deploy linh hoạt hơn, vẫn nên trong giờ làm việc để có người trực.
