# 🔍 Dry-Run Procedures

How to safely preview operations before executing.

---

## What is Dry-Run?

A mode that shows **what would happen** without making actual changes:

```bash
# Execute (changes database)
shop delete --id shop-123
# ✓ Shop deleted permanently

# Dry-run (preview only)
shop delete --id shop-123 --dry-run
# Would delete shop-123 with 5,000 products, 2,500 orders
# (No changes made)
```

---

## Dry-Run Support by Operation

| Operation | Supports --dry-run? | Command |
|-----------|---|---|
| batch create | ✅ | `batch create --csv shops.csv --dry-run` |
| template apply | ✅ | `template apply --template fashion --dry-run` |
| health check --auto-fix | ✅ | `health check --auto-fix --dry-run` |
| shop delete | ✅ | `shop delete --id <id> --dry-run` |
| backup restore | ✅ | `backup restore --shop <id> --backup-id <id> --dry-run` |
| sync config | ✅ | `sync config --from staging --to prod --dry-run` |
| K8s apply | ✅ | `kubectl apply -f manifest.yaml --dry-run=client` |
| --- | --- | --- |
| shop create | ❌ | Use staging instead |
| backup create | ❌ | Safe operation, no dry-run needed |
| health check | ❌ | Already read-only |

---

## Dry-Run Best Practices

### 1. Always Dry-Run First (If Available)

```bash
# Step 1: Dry-run
cmd --dry-run

# Step 2: Review output
# ✓ As expected? Proceed.
# ✗ Unexpected? Fix & re-run dry-run.

# Step 3: Execute (if approved)
cmd
```

### 2. Capture Dry-Run Output

```bash
# Save to file for PR/approval
batch create --csv shops.csv --dry-run > dry-run-output.txt

# Include in PR description:
# ## Dry-Run Output
# ```
# [paste output here]
# ```
```

### 3. Verify Dry-Run vs Actual

After executing, compare actual results to dry-run:

```bash
# Dry-run said: 10 would succeed, 2 would fail
# Actual result: [check logs]
# ✓ Matches dry-run expectations? Good.
# ✗ Different? Investigate why.
```

---

## Example Dry-Runs

### Batch Create Shops

```bash
$ batch create --csv customer-onboarding.csv --dry-run

Validating 12 shop records...
  ✓ shop_1: valid (domain01.example.com)
  ✓ shop_2: valid (domain02.example.com)
  ...
  ✗ shop_10: INVALID (missing domain)
  ✗ shop_11: DUPLICATE (domain exists)

Summary:
  Validated: 12 records
  Valid: 10
  Invalid: 2
  
  [Would create 10 shops, 2 would fail]
  Success rate: 83%
  
[Note: No shops created. Run without --dry-run to execute.]
```

### Backup Restore

```bash
$ backup restore --shop shop-123 --backup-id backup-2026-03-15 --dry-run

Checking backup integrity...
  ✓ Backup readable
  ✓ Checksum verified
  ✓ 45 GB data

Analyzing impact:
  Shop: shop-123
  Current data: 2026-04-07 (5,000 products, 2,500 orders)
  Target data: 2026-03-15 (5,000 products, 2,000 orders)
  
  Changes:
  - Products: unchanged
  - Orders: 500 deleted (orders between 2026-03-15 and 2026-04-07)
  - Customers: unchanged
  
  Estimated downtime: 5 minutes
  Rollback: possible (current data archived as backup)

[Ready to restore. Run without --dry-run to execute.]
```

### Health Check Auto-Fix

```bash
$ health check --auto-fix --dry-run

Scanning 150 shops...
  Found issues: 8
  
Issue 1: shop-001 - Database connection pool maxed
  Auto-fix: restart connection service
  Risk: low
  
Issue 2: shop-045 - Stale cache data (>24h old)
  Auto-fix: invalidate cache
  Risk: low
  
Issue 3: shop-089 - Missing product images
  Auto-fix: re-sync from CDN
  Risk: medium (downloads will spike bandwidth)
  
Summary:
  [Would fix 8 issues]
  Total risk: 2 low, 1 medium
  Estimated time: 15 minutes

[Review issues above. Run without --dry-run to execute.]
```

### Kubernetes Deploy

```bash
$ kubectl apply -f prod-deployment.yaml --dry-run=client

deployment.apps/api-core created (dry-run)
service/api-core created (dry-run)
configmap/api-config created (dry-run)

[No actual changes. Run without --dry-run to apply.]
```

---

## When Dry-Run is Not Available

If operation doesn't support `--dry-run`:

### Option 1: Test in Lower Environment

```bash
# Instead of risky in production
# Test in staging first
shop create --name test --domain test.staging.example.com

# Verify behavior
shop get --id <created-id>

# Then do it in production (with approval)
```

### Option 2: Manual Impact Analysis

```bash
# Understand what will happen
# without actually doing it

# Example: shop delete
# Impact: 
#   - Delete shop-123
#   - Delete 5,000 products from DB
#   - Delete 2,500 orders from DB
#   - Invalidate cache
#   - Archive data to backup
#
# Rollback:
#   - Restore from backup
#   - Restore cache
#
# Risks:
#   - Data loss (mitigated by backup)
#   - Downtime (5 min estimated)
```

---

## Dry-Run Checklist

Before executing any HIGH/CRITICAL operation:

- [ ] Dry-run command ran successfully
- [ ] Output captured & reviewed
- [ ] Output makes sense (matches expectations)
- [ ] No unexpected failures
- [ ] Rollback plan aligns with dry-run impact
- [ ] Timing OK (won't cause downtime/resource spike)
- [ ] Backup created (if applicable)
- [ ] Ready to execute

---

## See Also

- [approval-workflow-standard.md](approval-workflow-standard.md) — HIGH ops approval
- [approval-workflow-critical.md](approval-workflow-critical.md) — CRITICAL ops approval
