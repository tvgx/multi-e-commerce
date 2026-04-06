# Phase 2 Quick Reference

## Backup Commands

```bash
# Create backup
cli-tool backup create <shop-id>
cli-tool backup create <shop-id> --postgres --no-mongodb

# List backups (newest first)
cli-tool backup list <shop-id>
cli-tool backup list <shop-id> --limit 50

# Restore from backup
cli-tool backup restore <shop-id>
cli-tool backup restore <shop-id> --timestamp 20260406_120000
cli-tool backup restore <shop-id> --dry-run

# Delete backup
cli-tool backup delete <shop-id> 20260406_120000

# Rollback to latest backup
cli-tool backup rollback <shop-id>
```

## Audit Commands

```bash
# View audit trail (global)
cli-tool audit view
cli-tool audit view --limit 100

# View shop audit log
cli-tool audit view --shop <shop-id>

# View user audit trail
cli-tool audit view --user <user-id>

# View specific event type
cli-tool audit view --event shop.created

# View failed operations
cli-tool audit view --status failed

# Get audit statistics
cli-tool audit summary
cli-tool audit summary --shop <shop-id>
```

## Data Flow

### Backup Creation Flow
```
backup create <shop-id>
    ├─ BackupEngine.create_backup()
    ├─ PostgreSQL.backup() → postgresql.json.gz
    ├─ MongoDB.backup() → mongodb.json.gz
    ├─ Checksum verification
    ├─ metadata.json (timestamps, checksums, status)
    ├─ AuditLogger.log(BACKUP_CREATED)
    └─ Output: backup location + metadata
```

### Audit Logging Flow
```
Any operation
    ├─ Create AuditEvent
    ├─ Append to global audit.log (line-delimited JSON)
    ├─ Append to shop_<id>.audit (per-shop log)
    └─ Data: timestamp, user, action, shop, status, error, details
```

### Dry-Run Flow
```
Operation with --dry-run
    ├─ DryRunSimulator.simulate_*()
    ├─ Impact analysis (affected resources, risks, warnings)
    ├─ Data loss assessment
    └─ Output: preview without database changes
```

## Storage Locations

```
~/.ecommerce-cli/
├── config.json                      # CLI configuration
├── session.json                     # User session token
├── audit.log                        # Global audit trail (append-only)
├── shop_<id>.audit                  # Per-shop audit trail
└── backups/
    ├── <shop-id>/
    │   ├── 20260406_120000/
    │   │   ├── postgresql.json.gz  (PostgreSQL backup)
    │   │   ├── mongodb.json.gz     (MongoDB backup)
    │   │   └── metadata.json       (Backup metadata)
    │   ├── 20260406_113000/
    │   │   ├── postgresql.json.gz
    │   │   ├── mongodb.json.gz
    │   │   └── metadata.json
```

## Common Workflows

### Backup Before High-Risk Operation
```bash
# 1. Create backup
cli-tool backup create shop-123

# 2. Perform operation
cli-tool shop delete shop-123 --dry-run  # Preview first
cli-tool shop delete shop-123 --force

# 3. If needed, rollback
cli-tool backup rollback shop-123
```

### Investigate Failed Operation
```bash
# 1. View shop audit trail
cli-tool audit view --shop shop-123

# 2. See recent failures
cli-tool audit view --shop shop-123 --status failed

# 3. Rollback if needed
cli-tool backup rollback shop-123
```

### Compliance Audit
```bash
# Global statistics
cli-tool audit summary

# User activity
cli-tool audit view --user user-1 --limit 100

# Sensitive operations
cli-tool audit view --event auth.login --event permission.granted

# Export audit trail (pipe to file)
cli-tool audit view --json > audit_export_$(date +%Y%m%d).json
```

### Backup Management
```bash
# List backups with sizes
cli-tool backup list shop-123

# Get JSON for automation
cli-tool backup list shop-123 --json

# Restore to specific timestamp
cli-tool backup restore shop-123 --timestamp 20260406_120000

# Delete old backups manually
cli-tool backup delete shop-123 20260401_090000
```

## Integration Points

### With Phase 1 Commands
- All operations are logged to audit trail
- `--dry-run` flag uses DryRunSimulator
- High-risk ops suggest backup creation
- Backup auto-triggered before deletion/template-switch/domain-change

### With API
- Backups store API response data (shop settings, products, etc.)
- Audit logs capture API calls for sensitive operations
- Restore updates shop state via API

### With Authorization
- Each audit event includes `user_id` for accountability
- Audit view filtered by user permissions (future enhancement)
- Rollback operations recorded with user context

## Performance Characteristics

| Operation | Time | Storage |
|-----------|------|---------|
| Create backup | 5-30 sec | 5-50 MB |
| Restore backup | 5-30 sec | N/A (write only) |
| Audit view (100 events) | <100ms | N/A (read only) |
| List backups (10 backups) | <50ms | N/A (read only) |

## Troubleshooting

### Backup stuck/slow?
```bash
# Check backup size/status
cli-tool backup list <shop-id> --json

# Delete incomplete backups manually
rm -rf ~/.ecommerce-cli/backups/<shop-id>/<timestamp>/
```

### Audit log growing?
```bash
# Archive old logs (90 day retention)
gzip ~/.ecommerce-cli/audit.log
mv ~/.ecommerce-cli/audit.log.gz ~/backups/audit_$(date +%Y%m%d).log.gz
touch ~/.ecommerce-cli/audit.log
```

### Restore not working?
```bash
# Verify backup exists
cli-tool backup list <shop-id>

# Check backup integrity
ls -la ~/.ecommerce-cli/backups/<shop-id>/<timestamp>/

# View audit log for errors
cli-tool audit view --shop <shop-id> --status failed
```

---

## Next: Phase 3

- Setup wizard (8-step initialization)
- Batch operations (CSV/JSON)
- Health checks and auto-repair
- Environment synchronization
