# Backup & Restore

## Backup
- Tự động: CronJob hằng ngày (`k8s/jobs/backup-cronjob.yaml`). Retention: dev 7 / staging 30 / prod 90 ngày.
- Thủ công trước thao tác rủi ro: `backup create --shop <id> --name "pre-<op>-snapshot"`.

## Restore (CRITICAL)
1. `backup restore --shop <id> --backup-id <id> --dry-run` xem trước.
2. Tạo snapshot mới của hiện trạng (phòng hờ).
3. Test restore trên staging.
4. Đủ **2 approval** (Platform Admin + Ops/SRE) — [high-risk-ops/approval-workflow-critical.md](../high-risk-ops/approval-workflow-critical.md).
5. Thực hiện → verify dữ liệu → ghi audit.

Không restore thẳng prod khi chưa dry-run + approval.
