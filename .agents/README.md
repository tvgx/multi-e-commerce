# 📚 `.agents/` — Project Guidelines & Documentation Hub

Chào mừng đến **`.agents/`** — kho lưu trữ tập trung các hướng dẫn, quy tắc và tiêu chuẩn cho toàn bộ dự án **multi-ecommerce**.

---

## 🎯 Quick Navigation

### 👤 **Bạn là Developer mới?**
1. Đọc [core-rules/principles.md](core-rules/principles.md) — hiểu quy tắc cốt lõi
2. Đọc [code-conventions/](code-conventions/) — chuẩn code, branching, commits
3. Đọc [pr-workflow/checklist.md](pr-workflow/checklist.md) — chuẩn bị PR

### 🛠️ **Muốn thêm feature vào app?**
- **Admin Dashboard?** → [apps/admin/](apps/admin/)
- **API Core (Backend)?** → [apps/api-core/](apps/api-core/)
- **CLI Tool?** → [apps/cli-tool/](apps/cli-tool/)
- **Storefront?** → [apps/storefront/](apps/storefront/)

### 🏪 **ShopVolo v2 — Use-cases & Specification?**
→ [SHOPVOLO_V2_SPEC.md](SHOPVOLO_V2_SPEC.md) — 10 use-cases, actors, API endpoints, Postman testing

**Implementation Status**:
- **UC-01 (Tenant Onboarding)**: ✅ **LIVE** — `POST /api/v1/tenants/register` with owner creation, email validation
  - API: [apps/api-core/apis/shops-api.md](apps/api-core/apis/shops-api.md)
  - Postman: [UC-01 test request](https://www.postman.com/) in `api-core-all-endpoints.postman_collection.json`
  - DTOs: `RegisterTenantDto` with email/domain validation
  - Service: `ShopService.registerTenant()` with owner creation flow
- **UC-02 to UC-10**: 📋 Planned for next iterations

### 🚀 **Chuẩn bị Deploy?**
- **Staging?** → [infrastructure/deployment-procedure.md](infrastructure/deployment-procedure.md)
- **Production?** → [infrastructure/deployment-procedure.md](infrastructure/deployment-procedure.md) + [high-risk-ops/approval-workflow-critical.md](high-risk-ops/approval-workflow-critical.md)

### ⚠️ **Thao tác Rủi Cao (Delete, Restore, Sync)?**
→ [high-risk-ops/](high-risk-ops/) — approval workflow, dry-run, backup

### 🔐 **Bảo mật, Secret, RBAC?**
→ [security/](security/) — Azure Key Vault, access control, compliance

### 🚨 **Có Incident Production?**
1. [escalation/support-levels.md](escalation/support-levels.md) — identify severity (P1/P2/P3)
2. [escalation/on-call-procedures.md](escalation/on-call-procedures.md) — emergency process
3. [high-risk-ops/emergency-override.md](high-risk-ops/emergency-override.md) — SRE bypass

### 🔧 **Debug Problem?**
→ [troubleshooting/](troubleshooting/) — common issues & solutions

---

## 📖 Directory Structure

```
.agents/
├── README.md (you are here)
│
├── 🏛️ core-rules/
│   ├── principles.md            —— Nguyên tắc cốt lõi
│   ├── roles-permissions.md     —— Developer/Ops roles
│   └── escalation-contacts.md   —— Emergency contacts
│
├── 💻 code-conventions/
│   ├── branching-strategy.md    —— feature/fix/chore/hotfix naming
│   ├── commit-messages.md       —— Conventional Commits format
│   ├── linting-testing.md       —— ESLint, npm run test
│   ├── typescript-styles.md     —— Type hints, strict mode
│   └── python-styles.md         —— Docstrings, type hints
│
├── 📝 pr-workflow/
│   ├── checklist.md             —— Pre-submit requirements
│   ├── template.md              —— PR description template
│   ├── review-rules.md          —— Min reviewers per scope
│   └── merge-strategy.md        —— Squash, CI enforcement
│
├── ⚡ high-risk-ops/
│   ├── operations-matrix.md     —— CRITICAL/HIGH/MEDIUM priority
│   ├── approval-workflow-standard.md — Standard approval (HIGH ops)
│   ├── approval-workflow-critical.md — Critical approval (2-person)
│   ├── dry-run-procedures.md    —— Safe preview commands
│   └── emergency-override.md    —— SRE bypass + incident
│
├── 🏗️ infrastructure/
│   ├── environments.md          —— dev → acceptance → staging → prod
│   ├── manifests.md             —— K8s YAML structure
│   ├── deployment-procedure.md  —— Step-by-step deploy
│   ├── rollback.md              —— Failure recovery
│   └── deployment-windows.md    —— Prod windows (09:00–17:00 UTC)
│
├── 💾 database/
│   ├── schema-changes.md        —— Migration format, testing
│   ├── migrations.md            —— Run/rollback procedures
│   └── backup-restore.md        —— CronJobs, approval, procedures
│
├── 📊 monitoring/
│   ├── health-checks.md         —— Weekly CronJob, auto-fix
│   ├── alerts.md                —— Prometheus + Grafana rules
│   ├── audit-logging.md         —— Events, retention, export
│   └── observability.md         —— Logging, tracing, metrics
│
├── 🔐 security/
│   ├── secret-management.md     —— Azure Key Vault, rotation
│   ├── access-control.md        —— RBAC, onboarding/offboarding
│   ├── scanning.md              —— Secret scanning, pre-commit
│   └── compliance.md            —— SOC2, GDPR, audit export
│
├── 🤖 agents/
│   ├── automation-rules.md      —— K8s service account permissions
│   ├── ci-cd-rules.md           —— GitHub Actions allowed ops
│   └── copilot-guidelines.md    —— When to load AGENTS.md
│
├── 📈 escalation/
│   ├── support-levels.md        —— P1/P2/P3 SLA, owner
│   ├── on-call-procedures.md    —— Incident handling
│   └── post-mortem-template.md  —— RCA template
│
├── 🔖 release/
│   ├── versioning.md            —— SemVer, changelog
│   ├── release-process.md       —— Release checklist
│   └── hotfix-procedure.md      —— P1 bug fix fast-track
│
├── 📱 apps/
│   ├── README.md                —— 4 apps overview
│   ├── admin/                   —— Admin Dashboard guide
│   ├── api-core/                —— API Core backend guide
│   ├── cli-tool/                —— CLI Tool guide
│   └── storefront/              —— Storefront Engine guide
│
├── 🏪 SHOPVOLO_V2_SPEC.md       —— ShopVolo v2 use-cases, actors, Postman testing
│
├── 📦 templates/
│   ├── README.md                —— Available templates
│   ├── template-fashion.md      —— Fashion template
│   ├── template-electronics.md  —— Electronics template
│   ├── template-health.md       —— Health template
│   └── custom-template-creation.md — How to create templates
│
└── 🔨 troubleshooting/
    ├── README.md                —— Common issues index
    ├── development-issues.md    —— Local dev problems
    ├── deployment-issues.md     —— K8s, Docker issues
    ├── database-issues.md       —— Connection, migration issues
    └── auth-permission-issues.md — Access denied, RBAC issues
```

---

## 🗂️ Organization by Use Case

| Use Case | Where to Go |
|----------|-------------|
| **New to project** | → `core-rules/` → `code-conventions/` → `pr-workflow/` |
| **Understanding ShopVolo use-cases** | → `SHOPVOLO_V2_SPEC.md` |
| **Code feature** | → `apps/<app-name>/` → `code-conventions/` |
| **Deploy to prod** | → `infrastructure/deployment-procedure.md` + `high-risk-ops/` |
| **Delete shop / Restore backup** | → `high-risk-ops/approval-workflow-critical.md` |
| **Database schema change** | → `database/schema-changes.md` |
| **Fix security issue** | → `security/` |
| **Monitoring failure** | → `monitoring/` |
| **Out-of-hours incident** | → `escalation/on-call-procedures.md` → `high-risk-ops/emergency-override.md` |
| **Stuck on problem** | → `troubleshooting/` |

---

## 🎓 Learning Path

### Phase 1: Foundations (1–2 hours)
- [ ] [core-rules/principles.md](core-rules/principles.md) — why we have these rules
- [ ] [code-conventions/branching-strategy.md](code-conventions/branching-strategy.md) — branch naming
- [ ] [code-conventions/commit-messages.md](code-conventions/commit-messages.md) — commit format
- [ ] [pr-workflow/checklist.md](pr-workflow/checklist.md) — before you PR

### Phase 2: Your App (2–4 hours)
- [ ] [apps/](apps/) — pick your app: `admin/`, `api-core/`, `cli-tool/`, or `storefront/`
- [ ] `<app>/README.md` — overview
- [ ] `<app>/architecture.md` — understand tech stack
- [ ] `<app>/development.md` — local setup

### Phase 3: Operations (3–5 hours)
- [ ] [infrastructure/environments.md](infrastructure/environments.md) — how envs work
- [ ] [infrastructure/deployment-procedure.md](infrastructure/deployment-procedure.md) — how to deploy
- [ ] [high-risk-ops/operations-matrix.md](high-risk-ops/operations-matrix.md) — what's risky?
- [ ] [database/](database/) — if you touch schema

### Phase 4: Safety Net (1–2 hours)
- [ ] [security/](security/) — secret management
- [ ] [monitoring/](monitoring/) — alerts, health checks
- [ ] [escalation/](escalation/) — what to do when things break

---

## 🔗 Key References

### Internal
- [AGENTS.md](../AGENTS.md) — **Role-based permissions & approval chains** (refer to this for any access control questions)
- [README.md](../README.md) — Project overview

### External Standards
- [Conventional Commits](https://www.conventionalcommits.org) — commit message format
- [Semantic Versioning](https://semver.org) — version format
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/)
- [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/)

---

## 📋 Checklist Before Doing Something

**Creating a new feature?**
- [ ] Read [SHOPVOLO_V2_SPEC.md](SHOPVOLO_V2_SPEC.md) to understand the use-case
- [ ] Read the app's `architecture.md` (understand structure)
- [ ] Follow `code-conventions/` (linting, testing)
- [ ] Use template from `pr-workflow/template.md`

**Deploying to staging/prod?**
- [ ] Read `infrastructure/deployment-procedure.md`
- [ ] Check if it's high-risk → `high-risk-ops/`
- [ ] If prod: get approvals per `high-risk-ops/approval-workflow-critical.md`

**Changing database schema?**
- [ ] Read `database/schema-changes.md`
- [ ] Write migration (up + down)
- [ ] Test on local dev first
- [ ] Test on staging second
- [ ] Get approval before prod

**Stuck or something broke?**
- [ ] Check `troubleshooting/`
- [ ] If incident: escalate per `escalation/support-levels.md`

---

## 💡 Tips

1. **Bookmark this file** — it's your map for everything
2. **When in doubt, grep for a keyword** — every guide cross-links
3. **AGENTS.md is your bible** — when unsure about permissions, check root-level AGENTS.md
4. **Read examples** — each guide has real-world examples
5. **Post-mortem from incidents?** → Use template in `escalation/post-mortem-template.md`

---

## 📝 Contributing to this Hub

Want to improve these docs?
1. Edit the relevant `.md` file in `.agents/`
2. Follow `code-conventions/commit-messages.md` (type: `docs`, scope: section name)
3. Create PR with label `docs` and link related issue
4. At least 1 tech lead review

---

## 🔄 Last Updated

- **Date**: 2026-04-16
- **Version**: 2.1 (added ShopVolo v2 specification)
- **Maintainer**: Core Team & SRE
- **Review Cycle**: Monthly (next: 2026-05-16)

---

**Questions?** Check the relevant guide, or open an issue with label `docs`. Let's keep the team aligned! 🚀
