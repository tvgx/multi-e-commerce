# Automation Rules (K8s Service Account)

`sa-kubernetes` chỉ được:
- Backup create/delete theo lịch CronJob.
- Health check (read-only), audit export.
- Chạy job batch từ ConfigMap đã duyệt.

**Không** được: delete shop, restore prod, sync→prod, dùng `--force`. Những việc đó cần người (Platform Admin) + approval.

Mọi job: chạy với secret từ K8s Secret (không hardcode), log audit, idempotent, có giới hạn tài nguyên. Thất bại → alert, không tự retry thao tác phá huỷ.
