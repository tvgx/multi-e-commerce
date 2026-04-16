# 🏗️ Infrastructure — Deployment Procedure

Step-by-step deployment process for staging and production.

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test`, `pytest`)
- [ ] Code reviewed & approved (2 approvals for prod)
- [ ] Security scan passed (no critical vulnerabilities)
- [ ] Changelog updated (`CHANGELOG.md`)
- [ ] Version bumped (SemVer: MAJOR.MINOR.PATCH)
- [ ] Database migrations tested in staging
- [ ] Rollback plan documented
- [ ] Stakeholders notified (if breaking changes)

---

## Staging Deployment

### 1. Build & Push Images

```bash
# Tag version
VERSION=v1.2.3
REGISTRY=myregistry.azurecr.io

# Build all apps
./scripts/build-images.sh staging $VERSION

# Or individual app
docker build -t $REGISTRY/api-core:$VERSION apps/api-core
docker push $REGISTRY/api-core:$VERSION

# Tag as 'staging' (latest in staging)
docker tag $REGISTRY/api-core:$VERSION $REGISTRY/api-core:staging
docker push $REGISTRY/api-core:staging
```

### 2. Database Migrations (if needed)

```bash
# Run migrations in staging DB
kubectl exec -it pod/api-core-xxx -n ecommerce -- \
  npm run migrate:up

# Or via CLI
python main.py schema migrate --env staging --dry-run
python main.py schema migrate --env staging  # Execute
```

### 3. Update Deployments

```bash
# Update image in deployment
kubectl set image deployment/api-core \
  api="$REGISTRY/api-core:$VERSION" \
  -n ecommerce

# Or patch via kustomize/helm
kubectl patch deployment api-core \
  -p "{\"spec\": {\"template\": {\"spec\": {\"containers\": [{\"name\": \"api\", \"image\": \"$REGISTRY/api-core:$VERSION\"}]}}}}" \
  -n ecommerce
```

### 4. Monitor Rollout

```bash
# Watch deployment progress
kubectl rollout status deployment/api-core -n ecommerce --watch

# Output:
# deployment "api-core" successfully rolled out
# 3 of 3 replicas running

# Check pod health
kubectl get pods -n ecommerce -l app=api-core
kubectl describe pod/api-core-xxx -n ecommerce
```

### 5. Health Checks

```bash
# HTTP health check
curl https://api-staging.example.com/health

# Expected response (200 OK):
# {"status": "ok", "version": "v1.2.3", "timestamp": "..."}

# Check logs for errors
kubectl logs deployment/api-core -n ecommerce --tail=50

# Database connectivity
kubectl exec pod/api-core-xxx -n ecommerce -- \
  npm run db:check
```

### 6. Smoke Tests

```bash
# Run integration tests against staging
npm run test:integration -- --env=staging

# Or manually test key flows:
# 1. Log in to admin: https://admin-staging.example.com
# 2. Create a test product
# 3. Visit storefront: https://test-shop.staging.example.com
# 4. Verify product visible
```

---

## Production Deployment

### Prerequisites

**Only during change windows**: Weekdays 09:00–17:00 UTC

**Approvals needed**:
- [ ] Technical lead approval (code review)
- [ ] Operations approval (deployment readiness)
- [ ] Product approval (if feature change)

### 1. Backup Database (Automated, but verify)

```bash
# Pre-deployment backup runs automatically
kubectl get cronjob daily-backup -n ecommerce

# Or manually trigger backup
kubectl create job --from=cronjob/daily-backup \
  backup-pre-deployment-$(date +%s) -n ecommerce

# Verify backup completed
kubectl logs job/backup-pre-deployment-xxx -n ecommerce | tail -20
```

### 2. Build & Push Images (Same as Staging)

```bash
VERSION=$(grep version package.json | head -1 | awk '{print $2}' | tr -d '",')

docker build -t $REGISTRY/api-core:$VERSION apps/api-core
docker push $REGISTRY/api-core:$VERSION

# Tag as production release
docker tag $REGISTRY/api-core:$VERSION $REGISTRY/api-core:prod
docker push $REGISTRY/api-core:prod
```

### 3. Rehearse Deployment (Dry-Run)

```bash
# Preview changes without applying
kubectl apply -f k8s/apps/api-core.yaml --dry-run=client -o yaml | head -20

# Or use kustomize:
kustomize build k8s/overlays/production --dry-run > /tmp/deployment.yaml
cat /tmp/deployment.yaml | grep image:
```

### 4. Execute Deployment

```bash
# Option A: kubectl rolling update (default)
kubectl set image deployment/api-core \
  api="$REGISTRY/api-core:$VERSION" \
  -n ecommerce \
  --record  # Records rollout reason

# Option B: kubectl apply (declarative)
kubectl apply -f k8s/apps/api-core.yaml

# Rolling update settings:
# - maxSurge: 1 (one extra pod during update)
# - maxUnavailable: 0 (no downtime)
# - Graceful shutdown: Pod waits 30s before termination
```

### 5. Monitor Rollout (Watch Like a Hawk!)

```bash
# Terminal 1: Watch deployment
kubectl rollout status deployment/api-core -n ecommerce --watch

# Terminal 2: Watch pods
kubectl get pods -n ecommerce -l app=api-core -w

# Terminal 3: Stream logs
kubectl logs deployment/api-core -n ecommerce -f

# Signs of success:
# ✅ All old pods terminated gracefully
# ✅ All new pods running (3+ replicas)
# ✅ HTTP 200 from /health
# ✅ No ERROR logs

# Signs of failure:
# ❌ Pod crashes (CrashLoopBackOff)
# ❌ Timeout errors
# ❌ Database connection refused
```

### 6. Health Verification

```bash
# API endpoint
curl -v https://api.example.com/health

# Admin panel
curl -v https://admin.example.com/health

# CLI tool
python main.py health check --full

# Expected output:
# {
#   "status": "healthy",
#   "checks": {
#     "api": "ok",
#     "database": "ok",
#     "cache": "ok"
#   }
# }
```

### 7. Notify Stakeholders

```bash
# Slack notification
curl -X POST $SLACK_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚀 Production deployment complete",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*API Core v1.2.3* deployed to production\nDeployed by: @user\nTime: 2026-04-07 14:30 UTC"
        }
      }
    ]
  }'
```

---

## Post-Deployment

### 1. Monitor for 30 Minutes

Watch:
- Error rate (should be < 1%)
- Response latency (should be normal)
- Database connection pool
- Cache hit rate

### 2. Customer-Facing Testing

- [ ] Admin dashboard works
- [ ] Can create/edit products
- [ ] Can process orders
- [ ] Storefront renders correctly
- [ ] Analytics updated

### 3. Log Analysis (First Hour)

```bash
# Check for unexpected warnings/errors
kubectl logs deployment/api-core -n ecommerce \
  --since=1h | grep -E "ERROR|WARN" | head -20

# Check database slow queries
kubectl exec pod/api-core-xxx -n ecommerce -- \
  npm run db:slow-queries

# Monitor API latency
kubectl top pods -n ecommerce
```

---

## Rollback Procedure

### If Deployment Fails

**Automatic rollback** (if available):
```bash
# Kubernetes will auto-rollback if readiness probe fails
# (after 10 failures, will use previous replica set)
```

**Manual rollback**:
```bash
# Option 1: Re-apply previous deployment manifest
kubectl apply -f k8s/apps/api-core.yaml.backup

# Option 2: Use rollout history
kubectl rollout history deployment/api-core -n ecommerce

# revision 1  api-core:v1.2.2
# revision 2  api-core:v1.2.3  <- current (failing)

# Rollback to revision 1
kubectl rollout undo deployment/api-core -n ecommerce --to-revision=1

# Option 3: Manual pod deletion (forces new replicas)
kubectl delete pods -l app=api-core -n ecommerce
```

### Rollback Verification

```bash
# Check old pods are running
kubectl get pods -n ecommerce -l app=api-core

# Verify health
curl https://api.example.com/health

# Check version
curl https://api.example.com/api/version | jq .version
# Expected: "v1.2.2" (previous version)
```

---

## Deployment Checklist

Pre-deployment:
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Changelog updated
- [ ] Backup ready
- [ ] Rollback plan documented

During deployment:
- [ ] Image built & pushed
- [ ] Migrations tested
- [ ] Dry-run reviewed
- [ ] Deployment started
- [ ] Rollout monitored

Post-deployment:
- [ ] Health checks passing
- [ ] Logs clean
- [ ] Stakeholders notified
- [ ] Monitored for 30 min
- [ ] Close deployment ticket

---

See [README.md](README.md) | [environments.md](environments.md) | [manifests.md](manifests.md) | [rollback.md](rollback.md)
