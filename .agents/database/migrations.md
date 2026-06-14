# Migrations

Dự án dùng **migration viết tay** (không chạy `prisma migrate dev` sinh tự động vì cấu hình pooler).

- `.env`: **không có `DIRECT_URL`**; `DATABASE_URL` trỏ pooler **transaction-mode**.
- Deploy SQL migration qua **session pooler (port 5432)**, không qua transaction pooler.
- Mỗi migration: viết SQL `up` + chuẩn bị `down` (rollback). Idempotent nếu được.
- Quy trình: viết SQL → test local → test staging → backup prod → deploy prod (trong cửa sổ deploy) → verify.
- Nếu nghi schema lệch (drift): chạy `prisma migrate diff` đối chiếu; lịch sử có 2 migration reconcile (đã xử lý drift 2026-06).

> Lưu local memory dự án: `prisma-migrations-handwritten`, `supabase-db-schema-drift`.
