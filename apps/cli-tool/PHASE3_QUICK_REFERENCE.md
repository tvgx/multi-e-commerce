# Phase 3 Quick Reference

Quick command reference for Phase 3 automation workflows.

## Setup Wizard

```bash
# Start 8-step wizard
python main.py wizard start

# Apply to existing shop
python main.py wizard start --shop-id <shop-id>

# Output results
python main.py wizard start --json
```

**What it does**: Interactive setup with onboarding, payment, shipping, tax, notifications, analytics, security, review.

---

## Batch Operations

```bash
# Create from CSV
python main.py batch create shops.csv

# Create 500 shops fast (20 parallel workers)
python main.py batch create shops.json --parallel 20

# Preview first
python main.py batch create shops.csv --dry-run

# Continue if some fail
python main.py batch create shops.csv --continue-on-error

# Get results as JSON
python main.py batch create shops.csv --json
```

**CSV Format**:
```
name,domain,owner_email,template
Shop 1,shop1.com,owner1@example.com,fashion
Shop 2,shop2.com,owner2@example.com,electronics
```

**JSON Format**:
```json
[{"name":"Shop 1","domain":"shop1.com","owner_email":"owner1@example.com"}]
```

---

## Health Checks

```bash
# Run health check
python main.py health check <shop-id>

# Full detailed report
python main.py health check <shop-id> --full

# Auto-fix issues
python main.py health check <shop-id> --auto-fix

# Export as JSON
python main.py health check <shop-id> --json
```

**Checks included**:
- Shop exists
- Products valid
- Collections configured
- Domain setup
- Payment methods
- Storage operational

---

## Environment Sync

```bash
# Sync dev to acceptance
python main.py sync config <shop-id> --from dev --to acceptance

# Dry-run preview
python main.py sync config <shop-id> --from staging --to prod --dry-run

# Force sync (no confirmation)
python main.py sync config <shop-id> --from dev --to staging --force

# Don't backup before sync
python main.py sync config <shop-id> --from dev --to acceptance --no-backup

# View sync status
python main.py sync status
python main.py sync status --shop-id <shop-id>
```

**Environment hierarchy** (forward only):
```
dev → acceptance → staging → prod
```

---

## Integration with Phase 1 & 2

### Phase 1 Shop Commands (Enhanced)

```bash
# Create shop (now with audit logging)
python main.py shop create --name "Store" --domain example.com --owner-email owner@example.com

# Update shop (now with risk assessment)
python main.py shop update <shop-id> --name "New Name" --dry-run

# Delete shop (now with auto-backup)
python main.py shop delete <shop-id>
# → Creates backup automatically
# → Recover with: python main.py backup rollback <shop-id>
```

### Phase 2 Backup/Audit

```bash
# View all operations logged
python main.py audit view

# Get stats
python main.py audit summary

# Create backup
python main.py backup create <shop-id>

# Restore if needed
python main.py backup restore <shop-id>
```

---

## Typical Workflows

### Quick Setup for New Customer

```bash
python main.py wizard start              # 1. Run wizard (5-15 min)
python main.py backup create <shop-id>   # 2. Create backup
python main.py health check <shop-id>    # 3. Verify health
```

### Bulk Migration

```bash
python main.py batch create migrate.csv --dry-run    # 1. Preview
python main.py batch create migrate.csv --parallel 20 # 2. Create (fast)
python main.py audit view --action batch              # 3. Verify logs
```

### Safe Production Promotion

```bash
python main.py health check <shop-id> --full                    # 1. Check health
python main.py sync config <shop-id> --from staging --to prod --dry-run  # 2. Preview
python main.py sync config <shop-id> --from staging --to prod   # 3. Sync
python main.py backup rollback <shop-id>                         # 4. Fallback (if needed)
```

### Troubleshooting

```bash
python main.py health check <shop-id> --full           # 1. Check issues
python main.py audit view --shop <shop-id> --status failed  # 2. View errors
python main.py backup restore <shop-id>                # 3. Restore last backup
```

---

## Audit Trail

```bash
# All Phase 3 operations logged automatically

# View wizard operations
python main.py audit view --action "wizard"

# View batch operations
python main.py audit view --action "batch"

# View sync operations
python main.py audit view --action "Environment sync"

# View health checks
python main.py audit view --action "Health check"

# Export for compliance
python main.py audit view --json > audit_phase3.json
```

---

## Performance Tips

```bash
# For batch operations: Increase parallel workers for faster throughput
python main.py batch create shops.csv --parallel 50  # 50 concurrent workers

# For health checks: Run on multiple shops in parallel (via external tool)
for shop in $(python main.py shop list --json | jq -r '.[].id'); do
  python main.py health check $shop &
done

# For sync: Use --no-backup if backup already exists
python main.py sync config <shop-id> --from staging --to prod --no-backup
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Batch create hangs | Check API connectivity: `python main.py config --show` |
| Sync fails backward | Remember: forward only (dev→acceptance→staging→prod) |
| Health score low | Run `--full` report, check `backup restore` option |
| Wizard cancelled | Start over: `python main.py wizard start` |
| Out of memory (large batch) | Reduce `--parallel` workers or split CSV file |

---

## Related Commands

- **Phase 1**: `shop`, `template`, `domain`
- **Phase 2**: `backup`, `audit`
- **Phase 3**: `wizard`, `batch`, `health`, `sync`
- **System**: `config`, `health` (system status)

---

**Status: ✅ Phase 3 Complete** | [Full Documentation](PHASE3_IMPLEMENTATION.md)
