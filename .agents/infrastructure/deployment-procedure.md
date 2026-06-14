# Deployment Procedure

1. Code đã merge `main`, CI xanh (lint/test/build).
2. Có migration? Xem [database/migrations.md](../database/migrations.md) — deploy SQL trước/đồng bộ.
3. Trong [cửa sổ deploy](deployment-windows.md). Backup hiện trạng.
4. `kubectl diff` xem thay đổi manifest (dry-run).
5. Đủ approval nếu là thao tác HIGH/CRITICAL ([high-risk-ops/](../high-risk-ops/)).
6. Apply manifest (`k8s/apps/<app>.yaml`) → theo dõi rollout.
7. Health check + smoke test ([monitoring/health-checks.md](../monitoring/health-checks.md)).
8. Kiểm log không lỗi → thông báo. Lỗi → [rollback.md](rollback.md).
