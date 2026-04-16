# 💾 Database — Migrations & Version Management

Running, tracking, and rolling back database migrations.

---

## Migration Workflow

### Create a Migration

```bash
# Prisma (PostgreSQL migrations)
npx prisma migrate dev --name add_product_tags

# Output:
# ✔ Created new migration: 20260407141530_add_product_tags

# Or manually create migration file:
# prisma/migrations/20260407141530_add_product_tags/migration.sql

# Migration file created automatically with:
# - Timestamp (prevents conflicts)
# - Descriptive name
```

**Custom migration**:

```bash
# Create migration without auto-generate
npx prisma migrate resolve --rolled-back <migration-name>

# Or manually create:
# prisma/migrations/20260407141530_custom_migration/migration.sql
```

---

## Running Migrations

### Development

```bash
# Apply pending migrations (auto-prompts)
npx prisma migrate dev

# Or apply without prompting
npx prisma migrate deploy

# Reset entire DB (dev only, destroys data!)
npx prisma migrate reset
```

### Staging/Production

```bash
# Apply migrations only (no seeds/resets)
npx prisma migrate deploy

# Or via CLI tool:
python main.py schema migrate --environment staging --dry-run
python main.py schema migrate --environment staging

# Check migration status
npx prisma migrate status

# Output:
# Migration Status
# Migrations found in prisma/migrations: 15
# Applied: 14
# Pending: 1
```

---

## Migration Safety Features

### Pre-Migration Checks

```bash
# Check for data loss
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-url $DATABASE_URL

# Example output:
# ⚠️  Potential data loss:
#    - Dropping column: products.deprecated_field
#    - This will delete data for 1,234 rows

# Interactive prompt: Do you want to continue? (yes/no)
```

### Dry-Run Mode

```bash
# Test migration without applying
python main.py schema migrate --dry-run --environment staging

# Output:
# Migration plan:
# ✅ Migration 1: add_product_tags
# ✅ Migration 2: add_product_colors
# 
# Estimated duration: 5 minutes
# Estimated lock time: 10 seconds
# Risk: LOW
# 
# No changes applied. Run without --dry-run to execute.
```

### Lock Monitoring

```bash
# Monitor table locks during migration
# Terminal 1: Run migration
npx prisma migrate deploy

# Terminal 2: Monitor locks (PostgreSQL)
SELECT * FROM pg_stat_activity WHERE state LIKE 'Active%';
SELECT * FROM pg_locks WHERE pid = <process_id>;

# Or check lock wait
./scripts/db-monitor-locks.sh

# Output:
# Table: products | Lock type: AccessExclusiveLock
# Duration: 3.2 seconds (of 10s limit)
# Blocked queries: 2
```

---

## Monitoring Migrations

### Migration History

```bash
# View all migrations applied
npx prisma migrate resolve --status

# Output:
# Migration record:
# 20260320120000_initial_schema
# 20260325090000_add_users_table
# 20260401080000_add_products_table
# ...
# 20260407141530_add_product_tags (pending)

# Via CLI:
python main.py schema history

# Output:
# Migration ID    | Name                 | Applied At          | Duration
# 20260320120000  | initial_schema       | 2026-03-20 12:00 UTC| 15.3s
# 20260325090000  | add_users_table      | 2026-03-25 09:00 UTC| 8.5s
# 20260401080000  | add_products_table   | 2026-04-01 08:00 UTC| 22.1s
```

### Failed Migrations

```bash
# If migration fails mid-way:
npx prisma migrate resolve

# Prompts:
# Migration '20260407_add_product_tags' failed
# Status options:
#   1. apply (retry)
#   2. rollback
#   3. mark-as-applied (if manually fixed)

# Via CLI:
python main.py schema migrate --resolve --migration 20260407_add_product_tags
```

---

## Rollback Procedures

### Rollback to Previous Migration

```bash
# Find failed migration
npx prisma migrate status

# Rollback (only dev/test, not production!)
npx prisma migrate reset --force

# Production rollback (manual):
# 1. Stop API servers
kubectl scale deployment api-core --replicas=0 -n ecommerce

# 2. Undo migration manually
npx prisma migrate resolve --rolled-back 20260407_add_product_tags

# 3. Restart servers
kubectl scale deployment api-core --replicas=3 -n ecommerce
```

### Data Rollback (Restore from Backup)

```bash
# If migration corrupted data:
python main.py backup restore --backup-id backup-pre-migration-xxx

# Verify
npx prisma migrate status
# Should show: Applied: 14 (pre-migration count)
```

---

## Migration Best Practices

### ✅ DO

- ✅ Test migration in dev first
- ✅ Test with production-like data
- ✅ Use `--dry-run` to preview
- ✅ Create backup before production migration
- ✅ Document expected duration
- ✅ Monitor during migration
- ✅ Test data integrity after

### ❌ DON'T

- ❌ Skip dry-run
- ❌ Migrate during peak traffic
- ❌ Modify schema without migration files
- ❌ Run migrations in parallel on same DB
- ❌ Delete migration files after applying
- ❌ Assume migration will finish fast (test lock time!)

---

## Example: Production Migration

**Scenario**: Add non-nullable column with data population (5M rows)

```bash
# Step 1: Test in staging (full backup)
python main.py backup create --environment staging
npx prisma migrate deploy --environment staging
npx prisma migrate status --environment staging
npm run test:integration -- --environment staging

# Step 2: Schedule production migration
# Change Window: Tomorrow 14:00 UTC (1 hour slot)
# Estimated duration: 8 minutes
# Estimated lock time: 20 seconds

# Step 3: Backup production
python main.py backup create --environment production

# Step 4: Stop API (to prevent writes during data population)
kubectl scale deployment api-core --replicas=0 -n ecommerce

# Step 5: Run migration
npx prisma migrate deploy

# Step 6: Verify
npx prisma migrate status
SELECT COUNT(*) FROM products;  -- Verify all rows present

# Step 7: Restart API
kubectl scale deployment api-core --replicas=3 -n ecommerce

# Step 8: Monitor
kubectl logs deployment/api-core -n ecommerce -f | grep -i error

# Step 9: Smoke tests (manual + automated)
npm run test:integration -- --environment production
```

---

## Checklist: Running Migration

Before:
- [ ] Backup created (verified)
- [ ] Dry-run passed without warnings
- [ ] Test migration completed in staging
- [ ] Expected duration documented
- [ ] Rollback plan prepared
- [ ] Team notified

During:
- [ ] API servers stopped (if needed)
- [ ] Migration running
- [ ] Monitoring lock times
- [ ] Logs checked for errors
- [ ] Migration completed successfully
- [ ] Data integrity verified

After:
- [ ] API servers restarted
- [ ] Smoke tests passed
- [ ] Monitoring normal
- [ ] Migration ticket closed

---

See [README.md](README.md) | [schema-changes.md](schema-changes.md) | [backup-restore.md](backup-restore.md)
