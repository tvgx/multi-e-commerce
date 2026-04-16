# 🚨 Critical Approval Workflow

For **CRITICAL priority** operations (shop delete, backup restore, sync → prod, auto-fix prod).

---

## Why So Strict?

These ops can cause:
- ❌ **Data loss** (shop delete: lose all 10,000 products + orders)
- ❌ **Service downtime** (backup restore: 1–hour outage)
- ❌ **Production config change** (sync: affects all live shops)

**Result**: Requires 2-person approval, backup, full audit trail.

---

## Process at a Glance

```
1. Backup → 2. Dry-run → 3. Issue + PR → 4. 2-person approval → 
5. Execute → 6. Monitor 30 min → 7. Close + audit
```

---

## Step 1: Create Backup (Production Only)

If affecting production data:

```bash
# Create snapshot before any risky op
backup create --shop shop-123 \
  --name "pre-delete-snapshot-2026-04-08"

# Verify backup created
backup list --shop shop-123
```

**Keep this backup** for minimum 7 days (even after operation succeeds).

---

## Step 2: Dry-Run

Preview exact impact:

```bash
# Example: shop delete
shop delete --id shop-123 --dry-run

# Output:
# Would delete shop: shop-123
# - Name: \"Acme Corp\"
# - Products: 5,000
# - Orders: 2,500
# - Customers: 1,200
# - Data size: 45 GB
#
# Rollback: restore from backup pre-delete-snapshot-2026-04-08
```

---

## Step 3: Create Issue + PR

**GitHub Issue**:

```markdown
## Title: CRITICAL: Delete shop-123 (Acme Corp)

## Problem
Customer requested account closure. All data to be archived.

## Impact
- Shop: shop-123 (Acme Corp)
- Products to delete: 5,000
- Orders to delete: 2,500
- Customers affected: 1,200
- Estimated downtime: 5 minutes
- Data size: 45 GB

## Rollback Plan
Restore from backup: `pre-delete-snapshot-2026-04-08`
- Time to rollback: ~30 minutes
- Data recovery: Complete (all products, orders, customers)

## Timeline
- Issue created: 2026-04-08 09:00 UTC
- Approvals needed: 2 (platform admin + ops lead)
- Execution window: 2026-04-08 10:00 UTC
- Monitoring: 30 min post-delete

## Incidents / Concerns
None. Customer explicitly requested close.
```

**GitHub PR**:

Label: `risk/critical`, `priority/p0`

```markdown
## Description
Delete shop-123 per customer request.

## Changes
- Backup created: pre-delete-snapshot-2026-04-08
- Will delete shop-123 and all associated data

## Dry-Run Output
Would delete:
- 5,000 products
- 2,500 orders
- 1,200 customers
- 45 GB data

## Approval Checklist
- [ ] Approval #1: Platform Admin (approve & sign)
- [ ] Approval #2: Ops Lead (approve & sign)

## Rollback
Restore from backup if critical issue arises.

## Monitoring
Post-delete health check (30 min window).

Related Issue: #999
```

---

## Step 4: Get 2 Approvals

**Approver #1** (Platform Admin):
- Verify business requirement (customer requested? documented?)
- Confirm backup exists & tested
- Sign off: Comment with date & reason
  ```
  Approved by: Alice (Platform Admin)
  Date: 2026-04-08 09:30 UTC
  Reason: Customer account closure request documented
  ```

**Approver #2** (Different person: Ops Lead, SRE, DBA):
- Verify dry-run impact acceptable
- Confirm rollback plan works
- Check: no other critical ops in progress
- Sign off: Comment with date & reason
  ```
  Approved by: Bob (Ops Lead)
  Date: 2026-04-08 09:45 UTC
  Reason: Dry-run verified, rollback tested, timing OK
  ```

**Both approvals required** before executing.

---

## Step 5: Execute (with Audit)

```bash
# Execute with approver names logged
admin run --force \
  --reason "customer account closure request (doc: https://...)" \
  --approvers "alice@company.com,bob@company.com"
```

**Audit log entry created**:

```json
{
  "timestamp": "2026-04-08T10:00:00Z",
  "action": "SHOP_DELETED",
  "shop_id": "shop-123",
  "backup_created": "pre-delete-snapshot-2026-04-08",
  "approvers": ["alice@company.com", "bob@company.com"],
  "reason": "customer account closure request",
  "status": "success",
  "duration_ms": 1200
}
```

---

## Step 6: Monitor (30 min)

```bash
# Health checks
health check --full

# Verify no residual issues
audit view --since "5 minutes ago"

# Check resource usage
kubectl top nodes
kubectl top pods

# Spot-check: shop should not exist
shop get --id shop-123
# Output: Error 404 (expected, shop deleted)
```

**If issues**:
1. Immediately rollback
2. Notify team (Slack #incidents)
3. Create post-mortem (within 24h)

---

## Step 7: Close + Document

After successful execution:

- [ ] Close PR (merge completed)
- [ ] Close issue (with note: \"Successfully deleted 2026-04-08 10:00 UTC\")
- [ ] Audit log verified & immutable
- [ ] Backup retained (7 days minimum)

**Documentation**:
- PR/issue serves as permanent record
- Audit log immutable + encrypted

---

## Emergency Override (Out-of-Hours)

If CRITICAL op needed during off-hours (weekend/night):

```bash
# Only Platform Admin can use --force
admin run --force \
  --reason "P1-ICT-<incident-ticket>" \
  --approver-team "sre-on-call"
```

**Effect**:
1. Immediately escalates to on-call SRE via PagerDuty
2. 6-hour review window
   - If approved in 6h: change stands
   - If NOT approved in 6h: auto-rollback
3. Mandatory post-mortem within 24 hours

**Post-Mortem Topics**:
- Why was out-of-hours execution necessary?
- How can we prevent this emergency?
- What process improvements needed?

---

## Decision Tree

```
Operation needed?
│
├─ Is it CRITICAL? (delete, restore, sync→prod, auto-fix)
│  │
│  └─ YES → You are here [critical approval workflow]
│     │
│     ├─ Production?
│     │  ├─ YES → Need backup first
│     │  └─ NO → Skip backup
│     │
│     ├─ Create backup (prod only)
│     ├─ Dry-run operation
│     ├─ Create issue + PR
│     ├─ Get 2 approvals (platform admin + ops lead)
│     ├─ Execute with audit
│     ├─ Monitor 30 min
│     └─ Close + document
│
└─ Is it HIGH? → See [approval-workflow-standard.md](approval-workflow-standard.md)
```

---

## See Also

- [operations-matrix.md](operations-matrix.md) — full risk matrix
- [dry-run-procedures.md](dry-run-procedures.md) — how to dry-run safely
- [emergency-override.md](emergency-override.md) — out-of-hours incidents
