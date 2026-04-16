# ⚡ High-Risk Operations — README

Guidelines for operations that could cause data loss, downtime, or production impact.

---

## What's Risky?

| Operation | Risk Level | Impact | Approval |
|-----------|---|---|---|
| `shop delete` | **CRITICAL** | Lose all shop data, 100% downtime | 2-person |
| `backup restore` (prod) | **CRITICAL** | Data revert, potential loss | 2-person |
| `sync config` → prod | **CRITICAL** | Production config change, downtime | 2-person |
| `health check --auto-fix` (prod) | **CRITICAL** | Automated prod fix, could break things | 1-person |
| `batch create` (> 10 shops) | **HIGH** | Resource spike, partial failure | 1-person |
| `template apply` (prod) | **HIGH** | All shops' layouts change | 1-person |
| K8s manifest apply (prod) | **HIGH** | Deploy, restart pods, potential downtime | 2-person |
| DB migration (prod) | **HIGH** | Schema change, downtime, data migration | 2-person |
| --- | --- | --- | --- |
| `shop create` (dev) | MEDIUM | Safe, dev only | 0 |
| `template apply` (staging) | MEDIUM | Staging only | 1-person |
| `backup create` (any) | LOW | Safe operation | 0 |
| `health check` (any) | LOW | Read-only check | 0 |

---

## Files in This Section

1. **[operations-matrix.md](operations-matrix.md)** — Detailed matrix of all operations & risk levels
2. **[approval-workflow-standard.md](approval-workflow-standard.md)** — Standard approval (HIGH ops: dry-run → PR → approval → execute)
3. **[approval-workflow-critical.md](approval-workflow-critical.md)** — Critical approval (CRITICAL ops: 2-person, backup required)
4. **[dry-run-procedures.md](dry-run-procedures.md)** — How to safely preview operations
5. **[emergency-override.md](emergency-override.md)** — Out-of-hours SRE bypass + incident protocol

---

## Quick Decision Tree

**\"Can I just run this command?\"**

```
Does it affect prod?
  ├─ NO → Yes, run freely (dev/staging safe)
  │
  └─ YES → Check operation type
       ├─ CRITICAL (delete, restore, sync) → See [approval-workflow-critical.md](approval-workflow-critical.md)
       │ (Requires: issue + PR + 2-person approval + backup + dry-run)
       │
       ├─ HIGH (batch, template, K8s) → See [approval-workflow-standard.md](approval-workflow-standard.md)
       │ (Requires: dry-run + PR + 1-person approval)
       │
       └─ MEDIUM/LOW → Proceed with care
         (Recommend: dry-run, but not blocked)
```

---

## The Golden Rules

1. **Always dry-run first** (if available)
2. **Create backup before risky ops** (prod only)
3. **Get approval + audit trail** (CRITICAL/HIGH ops)
4. **Have rollback plan** (always)
5. **Monitor after execute** (30 min post-ops)
6. **Document everything** (incident ticket + post-mortem if needed)

---

## Typical Workflow

```
1. Decide to do risky operation
2. Check [operations-matrix.md](operations-matrix.md) for risk level
3. Dry-run (see [dry-run-procedures.md](dry-run-procedures.md))
4. Create backup (if CRITICAL/HIGH)
5. Create GitHub issue + PR (with dry-run output)
6. Get approval
   ├─ CRITICAL: 2-person approval
   └─ HIGH: 1-person approval
7. Execute (with logging)
8. Monitor (30 min watch for alerts/errors)
9. Audit log entry created (immutable)
10. Close issue + schedule post-mortem (if incident)
```

---

## When in Doubt

- Ask in #engineering Slack
- Tag @sre or @platform-admin
- Better to wait for approval than cause outage

---

**Next?** → [operations-matrix.md](operations-matrix.md)
