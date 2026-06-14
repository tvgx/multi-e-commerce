# CI/CD Rules (GitHub Actions)

`gh-actions` được phép: build, lint, test (Jest/Playwright), build Docker image, verify deploy K8s (dry-run/diff). Turbo cache để tăng tốc.

**Không** tự apply manifest lên prod hay chạy thao tác CRITICAL — chỉ tạo artifact/PR; người duyệt rồi mới deploy.

Quy tắc: secret từ GitHub Secrets/Key Vault (không in log); PR phải CI xanh mới merge; pipeline thất bại chặn merge; build tôn trọng thứ tự phụ thuộc Turborepo (import `@ecommerce/*` phải khai báo trong `dependencies`).
