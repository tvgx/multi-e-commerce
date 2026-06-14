# Secret Management

| Môi trường | Lưu | Xoay |
|-----------|-----|------|
| Dev (local) | `.env` (gitignore) | — |
| Staging | K8s Secrets + GitHub Secrets | hằng tháng |
| Prod | Azure Key Vault + GitHub Secrets | 2 tuần |

- **Không** commit/log/hiển thị secret. Đọc qua env (vd `process.env.STORAGE_BASE_URL`).
- CI lấy secret từ GitHub Secrets / Key Vault, không hardcode.
- Lộ secret → thu hồi + xoay ngay; secret scanning của GitHub tự phát hiện & cảnh báo.
- Secret dùng cho api-core (DB, Redis, MinIO/S3, better-auth, mail...) đặt trong `.env`/Secret tương ứng — không nhúng trong source.
