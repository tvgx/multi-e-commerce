# Quick Reference — `.agents/`

| Cần... | Vào |
|--------|-----|
| Hiểu module/feature/API | [apps/](apps/) + [api-doc](../api-doc/) |
| Quyền & vai trò | [core-rules/roles-permissions.md](core-rules/roles-permissions.md), [AGENTS.md](../AGENTS.md) |
| Commit message | [code-conventions/commit-messages.md](code-conventions/commit-messages.md) |
| Chuẩn bị PR | [pr-workflow/checklist.md](pr-workflow/checklist.md) |
| Deploy | [infrastructure/deployment-procedure.md](infrastructure/deployment-procedure.md) |
| Đổi schema CSDL | [database/schema-changes.md](database/schema-changes.md) |
| Backup/restore | [database/backup-restore.md](database/backup-restore.md) |
| Sự cố on-call | [escalation/support-levels.md](escalation/support-levels.md) |
| Rollback | [infrastructure/rollback.md](infrastructure/rollback.md) |
| Phát hành version | [release/release-process.md](release/release-process.md) |

## Pre-PR
Code theo [code-conventions/](code-conventions/) · test + coverage đạt ngưỡng · lint pass · commit đúng format · nhánh từ `main` · mô tả theo [template](pr-workflow/template.md) · không commit secret/file lớn.

## Pre-deploy prod
Đã merge `main` + test · kiểm migration ([database/migrations.md](database/migrations.md)) · trong cửa sổ deploy · backup · dry-run · đủ approval ([high-risk-ops/](high-risk-ops/)) · theo dõi health + smoke test.

## Sự cố
Xác định mức (P1/P2/P3 — [escalation/support-levels.md](escalation/support-levels.md)) → theo runbook ([escalation/on-call-procedures.md](escalation/on-call-procedures.md) / [troubleshooting/](troubleshooting/)) → cập nhật trạng thái định kỳ → post-mortem nếu P1.

Liên hệ: [core-rules/escalation-contacts.md](core-rules/escalation-contacts.md).
