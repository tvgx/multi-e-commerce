# Health Checks

- App: `GET /api/auth/health` (`@Public()`) — kiểm tra service sống.
- Phụ thuộc cần giám sát: PostgreSQL, Redis, MongoDB, MinIO/S3, Bull queue (`build`/`email`/`payment`).
- CLI: `python main.py health check [--full] [--auto-fix]`. `--auto-fix` trên prod là CRITICAL → cần approval.
- K8s: CronJob chạy health check định kỳ; lỗi → alert (Slack/PagerDuty theo mức P1/P2).
- Đổi logic health phải kèm test, không gây cảnh báo giả.
