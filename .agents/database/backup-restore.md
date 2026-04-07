# 💾 Database — Backup & Restore Procedures

Creating, managing, and restoring database backups.

---

## Backup Architecture

```
PostgreSQL Backups (daily)
    ↓
Encrypted in Azure Blob Storage
    ↓
Kept for 30 days
    ↓
Monthly snapshots (archived 1 year)

MongoDB Backups (daily)
    ↓
Encrypted in Azure Blob Storage
    ↓
Kept for 30 days
    ↓
Monthly snapshots (archived 1 year)
```

---

## Creating Backups

### Manual Backup

```bash
# Backup all databases
python main.py backup create

# Output:
# Starting backup...
# PostgreSQL: 1,250 tables, 2.3 GB
# MongoDB: 42 collections, 1.1 GB
# Total: 3.4 GB
# Backup ID: backup-20260407-143000-xyz
# Location: Azure Blob Storage
# Time: 12 minutes
# Encryption: AES-256

# Backup specific shop only
python main.py backup create --shop-id shop-456

# Output: Backup ID: backup-shop-456-20260407-143000-xyz
```

### Automated Backups

**Daily backup** (2 AM UTC):

```yaml
# k8s/jobs/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"  # 2 AM UTC daily
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: ecommerce-cli
          containers:
          - name: backup
            image: cli-tool:latest
            command:
            - python
            - main.py
            - backup
            - create
            - --all-shops
            - --compression gzip
            env:
            - name: BACKUP_RETENTION_DAYS
              value: "30"
            - name: BACKUP_NOTIFICATION_EMAIL
              value: devops@example.com
          restartPolicy: OnFailure
```

**Verify daily backup**:

```bash
# Check last 10 backups
python main.py backup list --limit 10

# Output:
# Backup ID          | Timestamp           | Size  | Status   | Type
# backup-20260407... | 2026-04-07 02:00 UTC| 3.4 GB| completed| full
# backup-20260406... | 2026-04-06 02:00 UTC| 3.5 GB| completed| full
# backup-20260405... | 2026-04-05 02:00 UTC| 3.3 GB| completed| full
```

---

## Listing & Managing Backups

### List Backups

```bash
# All backups
python main.py backup list

# By date range
python main.py backup list --from 2026-04-01 --to 2026-04-07

# By shop
python main.py backup list --shop-id shop-456

# Details
python main.py backup list --detailed

# Output:
# Backup ID: backup-20260407-143000-xyz
# Size: 3.4 GB (compressed from 4.1 GB)
# Type: Full backup (daily)
# Status: Completed
# Duration: 12 minutes
# PostgreSQL: 2.3 GB (1,250 tables)
# MongoDB: 1.1 GB (42 collections)
# Encryption: AES-256
# Retention: 30 days
# Restorable until: 2026-05-07
```

### Delete Old Backups

```bash
# Manual delete (backups > 30 days)
python main.py backup delete --older-than 30

# Or specific backup
python main.py backup delete --backup-id backup-20260301-xxx

# Verify deletion
python main.py backup list | grep backup-20260301
# (should not appear)
```

---

## Restoring from Backup

### Restore Full Database

```bash
# Dry-run first (preview impact)
python main.py backup restore \
  --backup-id backup-20260407-143000-xyz \
  --dry-run

# Output:
# Restore Plan:
# PostgreSQL: 1,250 tables, 2.3 GB (1,847,392 rows)
# MongoDB: 42 collections, 1.1 GB (234,567 documents)
# Duration: ~ 18 minutes
# Data Loss: Will overwrite current data
# Rollback: Available from backup-20260406
# 
# Proceed? (yes/no)

# Execute restore
python main.py backup restore \
  --backup-id backup-20260407-143000-xyz

# Output:
# Restoring from backup-20260407-143000-xyz...
# PostgreSQL: Restoring [████████████ ] 85% (3 min)
# MongoDB: Restoring [██████████████ ] 100% (2 min)
# Restore complete in 15 minutes
# Verify data integrity? yes/no
```

### Restore Specific Shop

```bash
# Restore only one shop's data
python main.py backup restore \
  --backup-id backup-20260407-143000-xyz \
  --shop-id shop-456

# Output: Restores only shop-456 data, leaves other shops unchanged
```

### Point-in-Time Restore

```bash
# Find closest backup before corruption time
python main.py backup list --from 2026-04-06 --to 2026-04-07

# Restore to that backup
python main.py backup restore --backup-id backup-20260406-xxx

# Then optionally replay transaction log from backup time to now
python main.py backup replay-transactions \
  --from 2026-04-06T18:00:00Z \
  --to 2026-04-07T10:00:00Z \
  --exclude-operations delete,drop
```

---

## Backup Verification

### Verify Backup Integrity

```bash
# Before restore:
python main.py backup verify --backup-id backup-20260407-143000-xyz

# Output:
# Verifying backup-20260407-143000-xyz...
# ✅ Backup file exists (3.4 GB)
# ✅ Checksum valid (matches stored hash)
# ✅ Encryption working (AES-256)
# ✅ PostgreSQL headers valid
# ✅ MongoDB headers valid
# ✅ Can be restored: Yes
# 
# Backup is healthy and restorable
```

### Verify Restored Data

```bash
# After restore:
python main.py schema validate

# Output:
# Validating schema and data...
# ✅ PostgreSQL: 1,250 tables present
# ✅ MongoDB: 42 collections present
# ✅ Row counts match backup: 1,847,392 rows
# ✅ No orphaned records found
# ✅ Foreign key constraints: OK
# ✅ Indexes: OK
# 
# Data is valid and consistent
```

---

## Disaster Recovery Scenario

**Scenario**: Database corrupted; must restore latest backup

```bash
# 1. Identify latest good backup
python main.py backup list --limit 5

# Latest:  backup-20260407-020000 (2 AM, completed)
# Current: 2026-04-07 14:00 (12 hours of data loss)

# 2. Alert team
# "Database corrupted at 2026-04-07 14:00 UTC"
# "Will restore to 2026-04-07 02:00 UTC (12 hour loss)"

# 3. Stop API servers (prevent writes)
kubectl scale deployment api-core --replicas=0 -n ecommerce

# 4. Restore
python main.py backup restore --backup-id backup-20260407-020000

# 5. Verify
python main.py schema validate

# 6. Restart API
kubectl scale deployment api-core --replicas=3 -n ecommerce

# 7. Notify users
# "System restored. 12 hours of today's data between 02:00-14:00 UTC was lost."
# "Affected operations: orders placed, products updated during that time"
```

---

## Backup Testing

### Monthly Restore Test

**Every month**, test backup restore procedure:

```bash
# 1. Pick oldest backup
BACKUP_ID=$(python main.py backup list --oldest | awk '{print $1}')

# 2. Restore to test database
python main.py backup restore \
  --backup-id $BACKUP_ID \
  --environment test-db

# 3. Verify
python main.py schema validate --environment test-db

# 4. Run integration tests
npm run test:integration -- --environment test-db

# 5. If OK, document success
# "Monthly restore test: PASSED"
# "Backup ID: $BACKUP_ID"
# "Date: $(date)"
# "Duration: X minutes"
```

---

## Backup Retention Policy

### Schedule

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Daily | Every day 2 AM UTC | 30 days |
| Weekly | Every Sunday 3 AM UTC | 90 days |
| Monthly | 1st of month 4 AM UTC | 1 year |
| Pre-migration | Before each migration | 7 days |
| Pre-deployment | Before prod deploy | 7 days |

### Storage

**Development**: Local SSD (automatic, no action needed)

**Staging**: 
- Azure Blob Storage (hot tier)
- Encrypted at rest
- 30-day retention

**Production**:
- Azure Blob Storage (hot tier first 30 days)
- Archive tier after 30 days (cheaper, slower)
- Encrypted at rest (AES-256)
- 1-year retention

### Cost Estimation

```
Daily backups: 3.5 GB × 30 days = 105 GB/month
Storage cost: ~$2/month (blob) + $0.50/month (archive) = ~$3/month

Monthly snapshots: 3.5 GB × 12 months = 42 GB/year archived
Archive cost: ~$6/year
```

---

## Checklist: Backup Strategy

- [ ] Daily backups automated & monitored
- [ ] Monthly restore test performed
- [ ] Backup retention policy documented
- [ ] Disaster recovery RTO/RPO defined (4h RTO, 24h RPO typical)
- [ ] Backup location documented (Azure Blob Storage)
- [ ] Encryption enabled (AES-256)
- [ ] Encryption keys managed (Azure Key Vault)
- [ ] Restore procedure tested (every month)
- [ ] Off-site backups (Azure handles geo-redundancy)

---

See [README.md](README.md) | [schema-changes.md](schema-changes.md) | [migrations.md](migrations.md)
