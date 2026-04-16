# 👤 Roles & Permissions Overview

Tóm tắt các roles trong dự án & quyền của chúng. **Chi tiết đầy đủ** → [../AGENTS.md](../AGENTS.md)

---

## 6 Main Roles

| Role | API Key Level | Allowed Ops | Notes |
|------|------|---|---|
| **Developer** | `dev-*` | List shops, create --dry-run, backup (manual), health check | Dev only, limited |
| **Shop Admin** | `shop-<id>` | Get/update own shop, apply templates, backup, restore (own shop) | Tenant-scoped, single shop |
| **Ops Admin** | `admin-ops` | Create shops, batch ops, health check --auto-fix, sync config (staging→accept) | All shops, multi-shop ops |
| **Platform Admin** | `admin-platform` | All commands, --force flag, shop delete, prod sync with approval | Full access, emergencies |
| **Kubernetes SA** | `sa-kubernetes` | Backup create/delete, health check, audit export | Automated jobs only |
| **CI/CD (GitHub Actions)** | `gh-actions` | Build, test, K8s deploy verification | Automated pipelines |

---

## What Can YOU Do?

### If You're a Developer
```
✅ shop list (personal shops only)
✅ shop create --dry-run
✅ backup create (manual)
✅ health check
✅ template apply --dry-run
❌ shop delete (not allowed)
❌ backup restore (requires approval)
❌ sync config (not allowed)
```

### If You're Ops Admin
```
✅ batch create (all shops)
✅ health check --auto-fix
✅ sync config (staging → acceptance)
✅ backup create/restore/delete
❌ shop delete (platform admin only)
❌ sync config → production (requires 2-person approval)
```

### If You're Platform Admin
```
✅ EVERYTHING
✅ shop delete
✅ sync config (any direction)
✅ health check --auto-fix
✅ --force flag (for emergencies)
⚠️ All changes logged + audit
⚠️ Post-mortem required if --force used
```

---

## Approval Chains

| Operation | Priority | Who Approves | Count |
|---|---|---|---|
| `shop delete` | CRITICAL | Platform Admin + On-call SRE | 2 |
| `backup restore` (prod) | CRITICAL | Platform Admin + Ops Lead | 2 |
| `sync config` → prod | CRITICAL | Platform Admin + Ops Lead | 2 |
| `health check --auto-fix` (prod) | CRITICAL | Ops Admin or Platform Admin | 1 |
| `batch create` (> 10 shops) | HIGH | Ops Lead | 1 |
| `template apply` (prod) | HIGH | Feature Lead | 1 |
| K8s manifest apply (prod) | HIGH | SRE + Tech Lead | 2 |

---

## API Key Rotation Schedule

| Role | Rotation | Risk |
|---|---|---|
| Developer | Monthly | Low |
| Shop Admin | Quarterly | Medium |
| Ops Admin | Quarterly | High |
| Platform Admin | Bi-weekly | **CRITICAL** |
| Service Accounts | Monthly | High |
| CI/CD | Monthly | High |

---

## Key Storage by Role

| Role | Dev | Staging | Prod |
|---|---|---|---|
| Developer | `.env` (local) | — | — |
| Ops Admin | — | GitHub Secrets | Azure Key Vault |
| Platform Admin | — | GitHub Secrets | Azure Key Vault + HSM |
| K8s SA | — | K8s Secret | K8s Secret (encrypted) |

---

## Next Steps

1. **Identify your role** — ask your team lead or manager
2. **Read [../AGENTS.md](../AGENTS.md)** — full permissions matrix
3. **If unsure** → ask before executing high-risk ops

---

**Tiếp theo?** → [escalation-contacts.md](escalation-contacts.md)
