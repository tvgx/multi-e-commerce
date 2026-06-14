# Database

CSDL chính: **PostgreSQL qua Prisma** (`packages/database`). MongoDB chỉ cho `layout` & `chat`.

- [schema-changes.md](schema-changes.md) — sửa schema Prisma đúng cách (model files + registry).
- [migrations.md](migrations.md) — migration **viết tay**, deploy qua session pooler.
- [backup-restore.md](backup-restore.md) — lịch backup, restore (CRITICAL, 2 approval).

## Cốt lõi (đặc thù dự án)
- Schema Prisma ghép từ `packages/database/prisma/models/*.prisma` qua `build-prisma-schema.js`; **file model mới phải thêm vào `MODEL_FILES`** nếu không sẽ bị bỏ qua.
- `packages/database` re-export `@prisma/client` → sau đổi schema phải `prisma generate`.
- Migration **viết tay** (không có `DIRECT_URL`; `DATABASE_URL` là pooler transaction-mode). Deploy SQL qua **session pooler (port 5432)**.

## Backup retention
Dev 7 ngày · Staging 30 ngày · Prod 90 ngày. Restore prod: dry-run + 2 approval ([high-risk-ops/](../high-risk-ops/)).
