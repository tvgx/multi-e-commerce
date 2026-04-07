# 🏗️ Infrastructure — Environments

Development, staging, and production configurations.

---

## Environment Overview

```
Development (Local)
├─ K3s on Docker Desktop / WSL2
├─ PostgreSQL + MongoDB (containers)
├─ Single-machine setup
└─ No HA, quick iteration

Staging (Cloud)
├─ Real K8s cluster (3 nodes)
├─ PostgreSQL (managed) + MongoDB (managed)
├─ Multi-node, production-like
├─ For testing before prod
└─ Auto-scaling disabled for cost

Production (Cloud)
├─ Real K8s cluster (5+ nodes)
├─ PostgreSQL (managed, HA) + MongoDB (managed, HA)
├─ Multi-region (if applicable)
├─ Auto-scaling enabled
├─ Monitoring + alerting + backup
└─ Disaster recovery plan
```

---

## Development Environment

### Local Setup

**Requirements**:
- Docker Desktop (Mac/Windows) or Docker + K3d (Linux)
- Node.js 18+
- Python 3.10+
- kubectl
- Azure CLI (if testing Key Vault)

**Quick start**:
```bash
cd /home/troll/workspaces/ecommerce-platform

# Start Kubernetes
docker desktop  # Or: k3d cluster create

# Or use provided script
bash ./scripts/setup-k3s.sh

# Deploy to local K8s
docker-compose up -d  # PostgreSQL, MongoDB, Redis
npm run dev  # Or individual app: cd apps/admin && npm run dev
```

**Database URLs** (dev):
```
PostgreSQL:  postgresql://user:password@localhost:5432/ecommerce_dev
MongoDB:     mongodb://localhost:27017/ecommerce_dev
Redis:       redis://localhost:6379/0
```

### Visual Studio Code Setup

```json
// .vscode/settings.json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "[python]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "ms-python.python"
  }
}
```

### Environment Variables

```bash
# apps/admin/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000

# apps/api-core/.env.local
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_dev
MONGODB_URL=mongodb://localhost:27017/ecommerce_dev
JWT_SECRET=dev-secret-do-not-use-in-prod
NODE_ENV=development

# apps/storefront/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000

# apps/cli-tool/.env.local
API_URL=http://localhost:3000
API_KEY=dev-token-xxx
```

---

## Staging Environment

### Infrastructure

```yaml
# Hosted: Azure Kubernetes Service (AKS) or similar
# Nodes: 3 (dev: 1, app: 1, db: 1)
# Node size: Standard_B2s (2 vCPU, 4 GB RAM)

Networking:
  VNet: 10.0.0.0/8
  Ingress: LoadBalancer (public IP)
  Private: Service-to-service via ClusterIP

Storage:
  PostgreSQL: Managed Azure Database (shared)
  MongoDB: Managed Cosmos DB (shared)
  Redis: Azure Cache for Redis
  Object Storage: Azure Blob Storage
```

### Deployment

```bash
# 1. Build images
./scripts/build-images.sh staging

# 2. Push to registry
docker push myregistry.azurecr.io/admin:staging-abc123
docker push myregistry.azurecr.io/api-core:staging-abc123

# 3. Update K8s manifests
kubectl set image deployment/admin \
  admin=myregistry.azurecr.io/admin:staging-abc123 \
  -n ecommerce

# 4. Verify rollout
kubectl rollout status deployment/admin -n ecommerce --watch

# 5. Health check
curl https://admin-staging.example.com/health
```

### Access

**SSH into nodes**:
```bash
az aks get-credentials --name ecommerce-staging --resource-group ecommerce
kubectl debug node/<node-name> -it --image=ubuntu
```

**View logs**:
```bash
kubectl logs deployment/api-core -n ecommerce -f
kubectl logs pod/<pod-name> -n ecommerce --previous  # Crashed pod
```

---

## Production Environment

### Infrastructure

```yaml
# Hosted: Azure Kubernetes Service (AKS) or similar
# Nodes: 5+ (distributed across 3 availability zones)
# Node size: Standard_D2s_v3 (2 vCPU, 8 GB RAM) minimum

High Availability:
  Multi-zone deployment
  Pod disruption budgets
  Cluster autoscaling (min: 5, max: 20 nodes)
  Network policies

Databases:
  PostgreSQL: Managed (HA with standby replica)
  MongoDB: Sharded cluster (HA by design)
  Redis: Cluster mode (6 shards, 1 replica each)
  Backups: Daily (retained 30 days)

Disaster Recovery:
  Active-active (if multi-region)
  Or: Active-passive (standby region)
  RTO (recovery time): < 1 hour
  RPO (recovery point): < 15 minutes
```

### Configuration Management

**Azure Key Vault** (secrets):
```bash
# Create secret
az keyvault secret set \
  --vault-name ecommerce-secrets-prod \
  --name api-db-password \
  --value $(openssl rand -base64 32)

# Rotate (scheduled quarterly)
az keyvault secret set \
  --vault-name ecommerce-secrets-prod \
  --name api-db-password \
  --value $(openssl rand -base64 32)
```

**ConfigMaps** (non-sensitive config):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: ecommerce
data:
  LOG_LEVEL: "info"
  TIMEZONE: "UTC"
  CACHE_TTL: "3600"
```

### Deployment Windows

**Only during change windows**:
- **Weekdays**: 09:00–17:00 UTC (PST business hours)
- **Frozen windows**: 
  - Fridays after 15:00 UTC
  - Weekends
  - Holidays
  - Release week (Fri-Mon frozen)

### Monitoring & Alerting

**Always-on monitoring**:
```
Prometheus metrics → Grafana dashboards → AlertManager → PagerDuty
        ↓
CPU, memory, disk, requests, errors, latency
        ↓
Alert if: P95 latency > 1s, error rate > 1%, pod crash loop
```

---

## Environment Parity

Keep dev/staging/prod as similar as possible:

| Aspect | Dev | Staging | Prod |
|--------|-----|---------|------|
| K8s version | Latest | Latest - 1 | Latest - 1 |
| DB version | Latest | Same | Same |
| Redis version | Latest | Same | Same |
| Node size | Minimal | Standard | Standard+ |
| Replicas | 1 | 2+ | 3+ |
| Autoscaling | Off | Off | On |
| Backup | Manual | Daily | Hourly |

---

## Switching Between Environments

```bash
# Check current context
kubectl config current-context

# List contexts
kubectl config get-contexts

# Switch to staging
kubectl config use-context staging-aks

# Switch to production
kubectl config use-context production-aks

# Verify (shows current namespace + cluster)
kubectl config view --minify
```

---

See [README.md](README.md) for overview | [manifests.md](manifests.md) | [deployment-procedure.md](deployment-procedure.md)
