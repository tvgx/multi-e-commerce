# Release Process

1. Gom thay đổi vào `main` (PR đã merge, CI xanh).
2. Cập nhật version + changelog (theo [versioning.md](versioning.md)).
3. Tạo tag `vX.Y.Z`.
4. Deploy staging → smoke test ([monitoring/health-checks.md](../monitoring/health-checks.md)).
5. Deploy prod trong [cửa sổ deploy](../infrastructure/deployment-windows.md), đủ approval nếu cần.
6. Verify health + log → thông báo release.
7. Lỗi → [rollback](../infrastructure/rollback.md).

Hotfix P1: fast-track (nhánh `hotfix/`, review 15', bump PATCH, deploy ngay).
