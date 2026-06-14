# K8s Manifests & Docker

Tất cả manifest ở `k8s/` (gốc repo):

```
k8s/
├── namespace.yaml
├── apps/            api-core.yaml, admin.yaml, storefront.yaml, design-agent.yaml
├── infrastructure/  minio.yaml, redis.yaml, cloudflared.yaml, monitoring.yaml
├── ingress/         ingress.yaml
├── backup/          cronjob-automated-backups.yaml
├── jobs/            backup-cronjob.yaml
├── cli/             namespace, jobs, cronjobs, storage
├── monitoring/      monitoring-stack.yaml
└── templates/       anti-affinity, pod-disruption-budgets, multi-node-readiness
```

Local: `docker/docker-compose.yaml`. Image build qua Dockerfile mỗi app.

Quy tắc: không apply thẳng prod — luôn `kubectl diff` / `--dry-run=server` trước; secret qua K8s Secret (không nhúng trong manifest); đặt resource limits + readiness/liveness probe.
