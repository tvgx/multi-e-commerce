# Phase 4 Quick Reference - Docker, K8s & CI/CD

## Docker Quick Start

```bash
# Build image locally
docker build -t ecommerce-cli:latest apps/cli-tool/

# Run with docker-compose (full stack)
docker-compose up -d
docker-compose exec cli python main.py shop list

# Run single container
docker run -e API_URL=http://api:3000/api ecommerce-cli --help

# Push to registry
docker buildx build --push -t ghcr.io/tvgx/.../ecommerce-cli:latest apps/cli-tool/
```

## Kubernetes Quick Start

```bash
# Deploy to k8s
kubectl apply -f k8s/cli/00-namespace.yaml
kubectl apply -f k8s/cli/30-storage.yaml
kubectl apply -f k8s/cli/10-jobs.yaml
kubectl apply -f k8s/cli/20-cronjobs.yaml

# Monitor
kubectl get -n ecommerce-cli job,cronjob,pod

# View logs
kubectl logs -n ecommerce-cli -f <pod-name>

# Create manual job
kubectl create -f k8s/cli/10-jobs.yaml
```

## Scheduled Operations

| CronJob | Schedule | What it does |
|---------|----------|-------------|
| backup-daily | 2 AM UTC daily | Backup all shops |
| health-checks-weekly | Sunday 3 AM UTC | Health check all shops |
| audit-export-weekly | Monday 4 AM UTC | Export audit logs |
| cleanup-old-backups | 1st month 1 AM UTC | Delete old backups |

## GitHub Actions

```
Workflow files:
├── cli-build.yml          # Test, lint, build image
├── cli-deploy.yml         # Deploy to staging/prod
└── cli-monitoring.yml     # 6-hourly health checks
```

**Workflow**:
1. Push to main → cli-build + cli-deploy (automatic)
2. Manual trigger → choose environment
3. Every 6 hours → cli-monitoring runs

## Common Tasks

### Deploy new version
```bash
git push origin main
# Triggers: test → build → deploy to staging
```

### Create 500 shops
```bash
# Create CSV file: shops.csv
# Then create job in K8s
kubectl apply -f k8s/cli/10-jobs.yaml

# Or run locally
docker-compose exec cli batch create shops.csv --parallel 20
```

### Backup all shops
```bash
# Manually trigger K8s job
kubectl create -f k8s/cli/10-jobs.yaml

# Or K8s runs it daily at 2 AM
kubectl get cronjobs -n ecommerce-cli backup-daily -o jsonpath='{.spec.schedule}'
```

### Check shop health
```bash
# Run health check job
kubectl apply -f k8s/cli/10-jobs.yaml

# View results
kubectl logs -n ecommerce-cli job/ecommerce-cli-health-check-* -f
```

### Export audit logs
```bash
# Runs weekly Monday 4 AM, or manually
kubectl create -f k8s/cli/10-jobs.yaml
```

## File Locations

```
Docker:
  apps/cli-tool/Dockerfile              # Multi-stage build
  apps/cli-tool/docker-compose.yml      # Local dev stack
  apps/cli-tool/.dockerignore           # Optimize image

Kubernetes:
  k8s/cli/00-namespace.yaml             # RBAC, config
  k8s/cli/10-jobs.yaml                  # One-off jobs
  k8s/cli/20-cronjobs.yaml              # Scheduled jobs
  k8s/cli/30-storage.yaml               # PersistentVolumes

CI/CD:
  .github/workflows/cli-build.yml       # Test & build
  .github/workflows/cli-deploy.yml      # Deploy to K8s
  .github/workflows/cli-monitoring.yml  # Health checks
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker build fails | `DOCKER_BUILDKIT=1 docker build ...` |
| K8s job pending | Check PVC, resource requests, image pulls |
| CronJob not running | Verify schedule syntax, check logs |
| Out of storage | Cleanup old backups manually |
| High CPU usage | Reduce parallel workers or job concurrency |

## Resource Requests

```
Development:  requests: 256Mi/250m    limits: 512Mi/500m
Batch jobs:   requests: 512Mi/500m    limits: 1Gi/1000m
Health check: requests: 256Mi/250m    limits: 512Mi/500m
Backup jobs:  requests: 512Mi/500m    limits: 1Gi/1000m
```

## Storage

```
Backup storage: 500 GB (ReadWriteMany)
Audit export:   50 GB (ReadWriteOnce)

Retention: 30 days (auto-cleanup monthly)
```

## Monitoring

Metrics exposed by GitHub Actions monitoring workflow:
- CLI jobs completed
- Storage bytes used
- Total backups created
- Audit events logged
- Health score average

View in Prometheus/Grafana or Slack notifications.

---

[Full Documentation](PHASE4_IMPLEMENTATION.md)
