# 📊 Operations Risk Matrix

Complete list of operations & their risk classification, approval chain, and guidelines.

---

## CRITICAL Priority Operations

**Require**: 2-person approval, backup (prod), dry-run, incident ticket, post-mortem if issues

| Operation | Command | Impact | Approval Chain |
|-----------|---------|--------|---|
| **Shop Deletion** | `shop delete --id <id>` | Lose all shop data (products, orders, customers) | Platform Admin + Ops Lead |
| **Backup Restore** (prod) | `backup restore --shop <id> --backup-id <id>` | Revert data to point-in-time | Platform Admin + DBA |
| **Config Sync** → prod | `sync config --from staging --to production` | Apply config changes to all prod shops | Platform Admin + Ops Lead |
| **Health Auto-Fix** (prod) | `health check --auto-fix --full` | Auto-repair issues in production | Ops Admin or Platform Admin |

### CRITICAL Approval Process

1. **Pre-check**: 
   - [ ] Understand impact (what data affected?)
   - [ ] Create backup (if store data)
   - [ ] Dry-run operation (preview results)

2. **Create Issue + PR**:
   - [ ] GitHub issue created (describe problem + impact)
   - [ ] PR with label `risk/critical` + `priority/p0`
   - [ ] Include: dry-run output, rollback plan, affected shops/users

3. **Get 2 Approvals**:
   - [ ] First approver (platform admin)
   - [ ] Second approver (different person: ops lead, sre, dba)
   - [ ] Both sign off with comments (date, reason, incident ticket)

4. **Execute**:
   ```bash
   admin run --force \
     --reason "restore shop data after data corruption" \
     --approvers "alice@company.com,bob@company.com"
   ```

5. **Monitor** (30 min):
   - [ ] Health checks pass
   - [ ] No alerts triggered
   - [ ] Audit log entry confirmed

6. **Post-Incident**:
   - [ ] If any issues: file post-mortem (within 24h)
   - [ ] Document learnings
   - [ ] Update runbooks

---

## HIGH Priority Operations

**Require**: 1-person approval, dry-run, PR (can merge same day)

| Operation | Command | Impact | Approval |
|-----------|---------|--------|---|
| **Batch Create** (> 10 shops) | `batch create --csv shops.csv` | Create multiple shops, resource spike | Ops Lead |
| **Template Apply** (prod) | `template apply --template <name> --shop <id>` | Change shop layout (all visitors see new design) | Feature Lead |
| **K8s Manifest Apply** (prod) | `kubectl apply -f prod.yaml` | Deploy code/config, restart pods | SRE + Tech Lead |
| **DB Migration** (prod) | `kubectl apply -f migration.yaml` | Schema change, potential downtime | DBA + Tech Lead |

### HIGH Approval Process

1. **Dry-Run**:
   ```bash
   batch create --csv shops.csv --dry-run
   # Output: "Would create 15 shops, 2 would fail (duplicate domain)"
   ```

2. **Create PR**:
   - [ ] Include dry-run output + checklist
   - [ ] Link to related ticket
   - [ ] Explain changes & impact

3. **Get 1 Approval**:
   - [ ] Reviewer approves (tag @appropriate-owner)
   - [ ] Reviewer verifies dry-run sensible

4. **Execute**:
   - [ ] Merge PR → triggers CI/CD
   - [ ] CI runs operation automatically
   - [ ] Monitor output

---

## MEDIUM Priority Operations

**Require**: Dry-run (optional), documentation, 0–1 approvals

| Operation | Command | Impact | Notes |
|-----------|---------|--------|---|
| **Shop Create** (dev/staging) | `shop create --name X --domain X` | Create single shop (safe) | No approval needed |
| **Template Apply** (staging) | `template apply --template fashion` | Change staging layout | No approval needed |
| **Backup Create** (any) | `backup create --shop <id>` | Create snapshot (read-only) | No approval, safe |
| **Shop Update** (staging) | `shop update --id <id> --domain X` | Modify config (staging) | No approval needed |

---

## LOW Priority Operations

**No approval needed**, just do it

| Operation | Notes |
|-----------|---|
| `shop list`, `shop get` | Read-only |
| `backup list`, `backup delete` (≥30 days) | List / cleanup |
| `health check` | Read-only diagnostics |
| `audit view`, `audit summary` | Read-only audit trail |
| `template list` | Read-only |

---

## Environment Rules

### Development
- All commands allowed
- No approval required (except best practices)
- Dry-run not enforced
- 24-hour data retention (auto-cleanup)

### Acceptance (Staging)
- Production-like environment
- HIGH/CRITICAL ops: 1-person approval
- Dry-run mandatory for risky ops
- 30-day data retention

### Production
- **STRICTEST** enforcement
- CRITICAL ops: 2-person approval
- Deployment window: 09:00–17:00 UTC (Mon–Fri)
- Out-of-hours: emergency only (incident ticket + post-mortem)
- 90-day data retention + archive

---

## Decision Checklist

Before executing any risky operation:

- [ ] Identified risk level (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] Dry-run completed (if available)
- [ ] Backup created (if CRITICAL/HIGH + production)
- [ ] Approvals obtained (if CRITICAL/HIGH)
- [ ] Rollback plan documented
- [ ] Monitoring configured (alerts active)
- [ ] Team notified (Slack #ops)
- [ ] Ready to execute

---

**Next?** → [approval-workflow-standard.md](approval-workflow-standard.md) (for HIGH ops)  
→ [approval-workflow-critical.md](approval-workflow-critical.md) (for CRITICAL ops)
