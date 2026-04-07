# 🔐 Security & Compliance — README

---

## Overview

**Secret Storage**: Azure Key Vault (prod), GitHub Secrets (staging), .env locally  
**Access Control**: RBAC (K8s), API key rotation (monthly–bi-weekly per role)  
**Scanning**: GitHub secret scanning (auto-revoke compromised keys)  
**Compliance**: SOC2, GDPR audit export (monthly)  

---

## Files

1. **secret-management.md** — Where to store secrets per environment, rotation schedule
2. **access-control.md** — RBAC, onboarding/offboarding checklist
3. **scanning.md** — GitHub secret scanning, pre-commit hooks
4. **compliance.md** — SOC2/GDPR, audit export, data retention

---

## Secret Checklist

Before deploying:

- [ ] No secrets in code (grep for password, api_key, secret, token)
- [ ] Rotate keys on schedule (monthly dev, quarterly ops, bi-weekly platform admin)
- [ ] Offboarded users: revoke access (same day)
- [ ] Compliance audit export: monthly

---

## Key Storage

| Env | Storage | Encryption | Rotation |
|---|---|---|---|
| dev | `.env` | None | N/A |
| staging | GitHub Secrets | At-rest TLS | Monthly |
| prod | Azure Key Vault | AES-256 + HSM | Bi-weekly |

---

**See detailed files→** [secret-management.md](secret-management.md), [access-control.md](access-control.md), [scanning.md](scanning.md), [compliance.md](compliance.md)
