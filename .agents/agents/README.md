# 🤖 Agents & Automation — README

---

## Overview

**K8s Service Accounts**: Backup CronJobs, health checks, audit exports  
**CI/CD (GitHub Actions)**: Build, test, deploy verification  
**Copilot/AI Agents**: Load AGENTS.md before risky operations  

---

## Files

1. **automation-rules.md** — K8s SA permissions, safe CronJob operations
2. **ci-cd-rules.md** — GitHub Actions allowed operations
3. **copilot-guidelines.md** — AI agent best practices, when to ask for approval

---

## K8s Service Account Operations

✅ Allowed:
- `backup create` (daily CronJob)
- `health check --full` (weekly CronJob)
- `audit view --json` (export for compliance)
- `backup delete` (≥30 days old)

❌ Not allowed:
- `sync config` (disabled for automation)
- `shop create` / `shop delete` (manual only)
- Direct API calls without audit trail

---

## CI/CD Pipeline (GitHub Actions)

```
Commit to main
  ↓
Generate build number
  ↓
Build Docker images
  ↓
Push to registry
  ↓
Run smoke tests (staging)
  ↓
Tag release + notify #releases
```

---

**See detailed files→** [automation-rules.md](automation-rules.md), [ci-cd-rules.md](ci-cd-rules.md), [copilot-guidelines.md](copilot-guidelines.md)
