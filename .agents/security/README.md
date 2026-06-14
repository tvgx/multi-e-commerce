# Security

- [secret-management.md](secret-management.md) — nơi lưu & xoay secret.
- [access-control.md](access-control.md) — RBAC, onboarding/offboarding.
- [scanning-compliance.md](scanning-compliance.md) — quét secret/lỗ hổng, tuân thủ.

Cốt lõi: secret để ngoài code (dev `.env` gitignore, staging K8s Secrets, prod Azure Key Vault) · không log secret · quyền theo vai trò ([core-rules/roles-permissions.md](../core-rules/roles-permissions.md)) · audit thao tác rủi ro.
