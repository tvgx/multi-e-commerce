# Monitoring

- [health-checks.md](health-checks.md) — health endpoint, CronJob kiểm tra, auto-fix.

Cốt lõi: theo dõi sức khỏe service (API/DB/Redis/Mongo/MinIO), cảnh báo khi lỗi; thay đổi ảnh hưởng health phải có test, không làm tăng false-positive. App có healthcheck `GET /api/auth/health`.
