# Infrastructure

Triển khai trên Kubernetes (thư mục `k8s/` ở gốc repo) + Docker Compose cho local (`docker/docker-compose.yaml`).

- [environments.md](environments.md) — các môi trường & luồng promote.
- [manifests.md](manifests.md) — cấu trúc YAML trong `k8s/`.
- [deployment-procedure.md](deployment-procedure.md) — các bước deploy.
- [deployment-windows.md](deployment-windows.md) — cửa sổ deploy prod.
- [rollback.md](rollback.md) — khôi phục khi lỗi.

`k8s/`: `apps/` (api-core, admin, storefront, design-agent) · `infrastructure/` (minio, redis, cloudflared, monitoring) · `ingress/` · `backup/` + `jobs/` (CronJob) · `cli/` · `templates/` (anti-affinity, PDB).
