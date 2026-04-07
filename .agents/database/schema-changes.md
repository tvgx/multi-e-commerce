# 💾 Database — Schema Changes & Version Control

Managing database schema evolution safely across environments.

---

## Schema Versioning

### Version Format

```
SCHEMA_VERSION YYYY-MM-DD-sequence

Examples:
- v1 (initial)
- v2-2026-01-15-01 (Jan 15, first change)
- v2-2026-01-15-02 (Jan 15, second change)
- v3-2026-04-07-01 (April 7, first change)
```

### Tracking Schema Version

```sql
-- PostgreSQL: Check current schema version
SELECT version, applied_at FROM schema_versions ORDER BY applied_at DESC LIMIT 1;

-- Output:
-- version              | applied_at
-- v3-2026-04-07-01    | 2026-04-07 14:30:00

-- MongoDB: Check schema version in metadata collection
db.schema_metadata.findOne();

-- Output:
-- {
--   "_id": ObjectId(...),
--   "version": "v3-2026-04-07-01",
--   "applied_at": ISODate("2026-04-07T14:30:00Z")
-- }
```

---

## Making Schema Changes Safely

### 1. Design Phase

```
📋 Requirements
    ↓
🎨 Design new schema
    ↓
✅ Review (backward compatible?)
    ↓
📝 Write migration
    ↓
🧪 Test in dev
```

**Questions to ask**:
- Backward compatible? (Can old code read new schema?)
- Will it lock tables? (Estimated lock time?)
- Data impact? (How many rows change?)
- Rollback plan? (Can we undo this?)

### 2. Write Migration

**PostgreSQL (Prisma)**:

```prisma
-- prisma/migrations/2026-04-07-add-product-tags.sql
-- Add tags column to products table (nullable initially, populate later)

ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];

-- Create index for performance
CREATE INDEX idx_products_tags ON products USING GIN (tags);

-- Populate existing rows
UPDATE products SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;

-- Make non-nullable
ALTER TABLE products ALTER COLUMN tags SET NOT NULL;
```

**MongoDB (Mongoose)**:

```typescript
// lib/migrations/2026-04-07-add-product-tags.ts
import { Db } from 'mongodb';

export async function up(db: Db) {
  // Add tags field to all products
  await db.collection('products').updateMany(
    {},
    { $set: { tags: [] } }
  );
  
  // Create index
  await db.collection('products').createIndex({ tags: 1 });
}

export async function down(db: Db) {
  // Remove tags field
  await db.collection('products').updateMany(
    {},
    { $unset: { tags: '' } }
  );
  
  // Drop index
  await db.collection('products').dropIndex('tags_1');
}
```

### 3. Test Migration

**Test in Development**:

```bash
# Test migration UP
npm run schema:migrate:up

# Verify schema changed
npm run schema:check

# Test migration DOWN (rollback)
npm run schema:migrate:down

# Verify schema reverted
npm run schema:check

# Test data integrity
npm run schema:validate
```

**Test with Production-Like Data**:

```bash
# Restore production backup to test DB
python main.py backup restore --backup-id backup-prod-xxx --environment test-db

# Run migration
npm run schema:migrate:up

# Verify data integrity
npm run schema:validate --environment test-db

# Compare row counts before/after
SELECT COUNT(*) FROM products;  # Should match backup
```

### 4. Deploy

**Staging First**:

```bash
# 1. Backup staging DB
python main.py backup create --environment staging

# 2. Run migration
npm run schema:migrate:up --environment staging

# 3. Verify
npm run schema:check --environment staging

# 4. Smoke tests
npm run test:integration -- --environment staging

# 5. If all OK, deploy to production
```

---

## Types of Schema Changes

### Safe Changes (No Downtime)

✅ **Adding nullable column**:
```sql
ALTER TABLE products ADD COLUMN new_field VARCHAR(255);
```
- Old code ignores new field
- New code uses new field (NULL for old rows)
- Populate data gradually

✅ **Adding column with default**:
```sql
ALTER TABLE products ADD COLUMN category_id INT DEFAULT 1;
```
- All rows get default value immediately
- No locking

✅ **Adding index**:
```sql
CREATE INDEX idx_products_category ON products(category_id);
```
- Runs in background (CONCURRENTLY in PostgreSQL)
- No table locks

### Risky Changes (May Need Downtime)

⚠️ **Removing column**:
```sql
ALTER TABLE products DROP COLUMN deprecated_field;
```
- Careful: Is old code still using this field?
- Deprecate first, wait 1 version, then remove

⚠️ **Changing column type**:
```sql
ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(10,2);
```
- Postgres: May lock table during conversion
- Test lock duration first
- Plan maintenance window

⚠️ **Adding non-nullable column without default**:
```sql
ALTER TABLE products ADD COLUMN required_field VARCHAR(255) NOT NULL;
```
- Must provide value for all existing rows
- May lock table

### Never Safe (Always Breaks)

❌ **Removing required column**:
- Breaks old code immediately
- Must coordinate with code deployment

❌ **Renaming column**:
- Breaks old code immediately
- Use: Add new column → migrate data → deprecate old → remove

---

## Migration Strategies

### Zero-Downtime Migration Pattern

**Add column, migrate data, then make required**:

```sql
-- Migration 1: Add new column (nullable)
ALTER TABLE products ADD COLUMN sku_new VARCHAR(255);

-- Migration 2: Backfill data
UPDATE products SET sku_new = sku WHERE sku IS NOT NULL;

-- Migration 3: Validate migration
SELECT COUNT(*) FROM products WHERE sku_new IS NULL;  -- Should be 0
SELECT COUNT(*) FROM products WHERE sku != sku_new;   -- Should be 0

-- Migration 4: Rename columns (in code + DB)
-- Old column: products.sku (retired)
-- New column: products.sku_new (now primary)

-- Migration 5 (later): Drop old column
ALTER TABLE products DROP COLUMN sku;
```

**Timeline**:
- T+0: Deploy code update (#1)
- T+2 hours: Apply migration 1-3
- T+24 hours: Deploy code update (#2, discard old column)
- T+1 week: Apply migration 5 (drop old column)

---

## Rollback Strategy

### Rollback from Failed Migration

```bash
# 1. Identify which migration failed
npm run schema:history --limit 5

# 2. Stop API servers (prevent writes)
kubectl scale deployment api-core --replicas=0 -n ecommerce

# 3. Undo migration
npm run schema:migrate:down

# 4. Verify rollback
npm run schema:check

# 5. Verify data integrity
npm run schema:validate

# 6. Restart API servers
kubectl scale deployment api-core --replicas=3 -n ecommerce

# 7. If data loss detected, restore backup
python main.py backup restore --backup-id backup-pre-migration
```

---

## Example: Multi-Step Safe Migration

**Goal**: Rename `user_id` to `owner_id` in products table

**Step 1**: Add new column, copy data (no downtime)
```sql
ALTER TABLE products ADD COLUMN owner_id INT;
UPDATE products SET owner_id = user_id;
```

**Step 2**: Update application code to use both columns (1 version)
```typescript
// Old code: product.user_id
// New code: product.owner_id || product.user_id (fallback)
```

**Step 3**: Update application to use only new column (next version)
```typescript
// App now uses only product.owner_id
```

**Step 4**: Drop old column
```sql
ALTER TABLE products DROP COLUMN user_id;
```

**Timeline**: ~2-3 weeks for safe migration

---

## Checklist: Schema Change

Before migration:
- [ ] Design reviewed & approved
- [ ] Migration tested in dev
- [ ] Migration tested with prod-like data
- [ ] Rollback procedure tested
- [ ] Backward compatibility verified
- [ ] Data integrity checks written

During migration:
- [ ] Backup created
- [ ] Maintenance window scheduled (if needed)
- [ ] API servers stopped (if table locks expected)
- [ ] Migration executed
- [ ] Verification queries passed
- [ ] API servers restarted
- [ ] Smoke tests passed

After migration:
- [ ] Monitor for errors (1+ hour)
- [ ] Verify data integrity
- [ ] Close migration ticket

---

See [README.md](README.md) | [migrations.md](migrations.md) | [backup-restore.md](backup-restore.md)
