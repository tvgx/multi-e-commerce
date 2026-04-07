# 🔄 Standard Approval Workflow

For **HIGH priority** operations (batch create, template apply, K8s manifests).

---

## Process at a Glance

```
1. Dry-run → 2. PR + checklist → 3. 1-person approval → 4. Execute → 5. Monitor
```

---

## Step 1: Dry-Run (Preview)

Run command with `--dry-run` flag to see what would happen:

```bash
# Example: Batch create shops
batch create --csv shops.csv --dry-run

# Output:
# ✓ 10 shops would be created
# ✗ 2 shops would fail (domain already exists):
#   - shop-1: domain01.example.com (DUPLICATE)
#   - shop-2: domain02.example.com (DUPLICATE)
# Result: 10 success, 2 failed (80% success rate)
```

### Dry-Run Success Criteria

- [ ] No unexpected failures
- [ ] Resources available (don't max out capacity)
- [ ] All inputs valid (no validation errors)

If dry-run shows problems:
- [ ] Fix inputs & re-run dry-run
- [ ] Decide: proceed anyway or cancel

---

## Step 2: Create PR with Checklist

Open a GitHub PR with:

**Title**:
```
feat(ops): batch create 10 new shops from customer list
```

**Description** (see `../pr-workflow/template.md`):

```markdown
## Description
Batch create 10 shops for Q2 customer onboarding.

## Changes
- Create 10 new shops (see shops.csv)
- Initialize with fashion template
- Set up billing for customer accounts

## Related Issue
Fixes #567

## Dry-Run Output
See attached:
- 10 shops would create ✓
- 2 duplicates would fail ✗
- Expected success rate: 80%

## Testing / Approval
- [x] Dry-run completed
- [ ] Operator approval (waiting)
- [ ] Monitor during execute (scheduled 2026-04-08 10:00 UTC)

## Rollback Plan
If any shop created wrong: 
```bash
batch delete --csv shops.csv --names "bad_shop_1,bad_shop_2"
```

## Approver
@ops-lead — please review dry-run output & approve
```

**Labels**: `risk/high`, `type/ops`, `priority/p1`

---

## Step 3: Get 1-Person Approval

Reviewer checks:

- [ ] Dry-run output makes sense
- [ ] Inputs are correct (no typos)
- [ ] No other ops running in parallel
- [ ] Rollback plan viable
- [ ] Timing OK (won't cause downtime)

**Approve**: Comment \"Approved\" + ✅

---

## Step 4: Execute

Once approved:

```bash
# Method 1: Automated CI/CD (if configured)
# Merge PR → CI/CD auto-executes

# Method 2: Manual execution
batch create --csv shops.csv \
  --approver "ops-lead@company.com"

# This logs:
# - Command executed
# - Approver name
# - Timestamp
# - Success/failure rate
```

### Execution Output

```
Starting batch create...
  [████████░░] 80% complete (8/10 shops)
  - shop_001: ✓ created
  - shop_002: ✓ created
  - ...
  - shop_201: ✗ failed (domain exists)
  
Summary:
  ✓ 8 shops created
  ✗ 2 shops failed
  
Audit logged: batch_create_2026_04_08_10_00_00
```

---

## Step 5: Monitor (30 min)

After execution:

- [ ] Check for errors in logs
- [ ] Verify health checks pass
- [ ] Monitor resource usage (CPU, memory, disk)
- [ ] Watch alerts for anomalies
- [ ] Spot-check created resources (did shop creation work correctly?)

**Example monitoring**:

```bash
# Check health
health check --full

# View recent audit
audit view --since "5 minutes ago"

# Check resource usage
kubectl top nodes
kubectl top pods
```

If issues appear → escalate to high-risk workflow or rollback.

---

## Template Execution (HIGH Example)

**Template Apply** (changing shop layout in production):

```
1. DRY-RUN
   template apply --template fashion --dry-run
   → Output: "Would update 45 shops with fashion layout"

2. PR + CHECKLIST
   Title: "feat(ops): apply fashion template to all tier-1 shops"
   Include: dry-run output, which shops affected, rollback (revert to old template)

3. APPROVAL
   Reviewer checks: 45 shops in tier-1 category? Yes. Layout tested in staging? Yes. Approved ✅

4. EXECUTE
   template apply --template fashion \
     --approver "feature-lead@company.com"

5. MONITOR
   health check --full
   Watch Grafana for traffic pattern changes
   Spot-check 5 affected shops in browser
```

---

## See Also

- [operations-matrix.md](operations-matrix.md) — is your op HIGH or CRITICAL?
- [approval-workflow-critical.md](approval-workflow-critical.md) — for CRITICAL ops (2-person approval)
- [dry-run-procedures.md](dry-run-procedures.md) — detailed dry-run guide
