# 💾 Database & Data Operations — README

---

## Quick Start

**Schema changes**: Write migration (up + down scripts), test locally → staging → production  
**Backup**: Auto-run daily CronJob (00:00 UTC), 30-day retention  
**Restore**: CRITICAL operation, requires 2-person approval + dry-run  

---

## Files

1. **schema-changes.md** — Migration naming, format, testing
2. **migrations.md** — How to run/rollback migrations
3. **backup-restore.md** — Backup schedule, restore approval,procedures

---

## Migration Checklist

- [ ] Migration file created (`001_add_column_x.sql`)
- [ ] Both up & down scripts (rollback plan)
- [ ] Backward-compatible (old code works with new schema)
- [ ] Tested locally (apply + rollback + apply)
- [ ] Tested on staging + production (with copy of prod data)
- [ ] Estimate downtime
- [ ] PR with migration + code changes

---

## Backup & Restore

**Backup**:
```bash
backup create --shop <id> --name "pre-migration-snapshot"
```

**Restore** (requires approval):
```bash
backup restore --shop <id> --backup-id <id> --dry-run
# → See critical approval workflow in high-risk-ops/
```

---

## Retention Policy

| Environment | Retention | Auto-cleanup |
|---|---|---|
| Dev | 7 days | Yes (auto-delete > 7 days) |
| Staging | 30 days | Yes (auto-delete > 30 days) |
| Prod | 90 days | Manual (for compliance) |

---

**See detailed files→** [schema-changes.md](schema-changes.md), [migrations.md](migrations.md), [backup-restore.md](backup-restore.md)
