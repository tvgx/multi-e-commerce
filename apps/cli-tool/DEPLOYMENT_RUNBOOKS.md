# E-commerce CLI - Deployment Runbooks

**Version:** 1.0  
**Last Updated:** April 6, 2026  
**Audience:** DevOps Engineers, Platform Administrators

---

## Table of Contents

1. [Planning & Preparation](#planning--preparation)
2. [Local Development Deployment](#local-development-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment (Staging)](#kubernetes-deployment-staging)
5. [Kubernetes Deployment (Production)](#kubernetes-deployment-production)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
7. [Disaster Recovery](#disaster-recovery)
8. [Maintenance Procedures](#maintenance-procedures)

---

## Planning & Preparation

### Pre-Deployment Checklist

**1 Week Before**

- [ ] Review AGENTS.md permissions (any role changes?)
- [ ] Check PHASE1-4 documentation for new features
- [ ] Verify all tests pass: `pytest apps/cli-tool/`
- [ ] Run security scan: `trivy image ecommerce-cli:staging`
- [ ] Coordinate with team on change window
- [ ] Prepare rollback plan (see Disaster Recovery section)

**1 Day Before**

- [ ] Backup all PostgreSQL databases
- [ ] Backup all MongoDB collections
- [ ] Export audit trail: `python main.py audit view --json > audit_backup.json`
- [ ] Document current version: `python main.py --version`
- [ ] Test docker build locally: `docker build -t ecommerce-cli:test apps/cli-tool/`
- [ ] Verify staging environment is healthy
- [ ] Send team notification of upcoming deployment

**Deployment Day (Before)**

- [ ] Verify all backups completed successfully
- [ ] SSH access confirmed to all servers
- [ ] kubectl configured and authenticated
- [ ] Docker registry credentials verified
- [ ] Change ticket open and assigned
- [ ] Team leads confirmed for emergency contact

### Environment Prerequisites

```bash
# Required tools
- Python 3.11+
- Docker 20.10+
- Docker Compose 2.0+
- kubectl 1.26+
- Helm 3.12+ (optional, for advanced deployments)

# Required credentials
- GitHub access (repo + container registry)
- API keys (all environments)
- Database credentials
- Cloud provider access (if using cloud K8s)

# Required network access
- API servers (dev/staging/prod)
- Database servers
- Container registry
- K8s cluster (kubectl endpoint)
```

---

## Local Development Deployment

### Scenario: First-Time Local Setup

**Time Required:** 15 minutes

```bash
# Step 1: Clone repository
git clone https://github.com/tvgx/multi-e-commerce.git
cd multi-e-commerce

# Step 2: Start development environment
docker-compose up -d

# Verify all services running
docker-compose ps
# Should show: postgres, mongodb, minio, api-core, cli-tool all "Up"

# Step 3: Wait for database initialization (30-60 seconds)
docker-compose logs -f postgres

# Step 4: Configure CLI
export CLI_ENV=dev
export API_URL=http://localhost:3000/api
export API_KEY=dev-key-12345

# Step 5: Verify connectivity
python apps/cli-tool/main.py config --show

# Step 6: Create test shop
python apps/cli-tool/main.py shop create \
  --name "Test Shop" \
  --domain test-shop.local \
  --owner-email test@example.com \
  --template fashion
```

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| "Connection refused: postgres" | `docker-compose logs postgres` - wait 30s more |
| "Invalid API key" | Check `export API_KEY=dev-key-12345` |
| "Shop creation fails" | Check API running: `curl http://localhost:3000/api/health` |

---

### Scenario: Update CLI After Code Changes

**Time Required:** 5 minutes

```bash
# Step 1: Stop old CLI container
docker-compose stop cli-tool

# Step 2: Rebuild CLI image
docker-compose build cli-tool

# Step 3: Start updated CLI
docker-compose up -d cli-tool

# Step 4: Verify health
docker exec ecommerce-cli-tool python main.py config --show

# Step 5: Run tests in container
docker exec ecommerce-cli-tool pytest tests/
```

---

### Scenario: Full Data Reset

**Time Required:** 3 minutes

```bash
# WARNING: This deletes all local data

# Step 1: Stop all services
docker-compose down

# Step 2: Remove volumes
docker volume rm $(docker volume ls -q | grep ecommerce)

# Step 3: Restart clean
docker-compose up -d

# Step 4: Wait for database initialization
sleep 30

# Step 5: Re-seed sample data
docker exec ecommerce-api python seed-sample-shop.ts

# Step 6: Verify
python apps/cli-tool/main.py shop list
```

---

## Docker Deployment

### Scenario: Build Production Docker Image

**Time Required:** 10 minutes

```bash
# Step 1: Prepare repository
git checkout main
git pull origin main
npm run lint
npm run test

# Step 2: Build with BuildKit (faster)
export DOCKER_BUILDKIT=1
docker build \
  -t ecommerce-cli:v1.0.0 \
  -t ecommerce-cli:latest \
  apps/cli-tool/

# Step 3: Inspect image
docker inspect ecommerce-cli:v1.0.0 | grep -E '"Size"|Layers'
# Expected size: 450-500 MB

# Step 4: Test image
docker run ecommerce-cli:v1.0.0 --help
docker run ecommerce-cli:v1.0.0 --version

# Step 5: Tag for registry
docker tag ecommerce-cli:v1.0.0 gcr.io/project-id/ecommerce-cli:v1.0.0
docker tag ecommerce-cli:latest gcr.io/project-id/ecommerce-cli:latest

# Step 6: Push to registry
docker push gcr.io/project-id/ecommerce-cli:v1.0.0
docker push gcr.io/project-id/ecommerce-cli:latest
```

**Optimization Tips:**

- Use `.dockerignore` to exclude large files
- Multi-stage build reduces from 900MB → 450MB
- BuildKit caching speeds subsequent builds 10x
- First build: 3-5 min | Subsequent: 30-60 sec

---

### Scenario: Deploy Single Container (Non-K8s)

**Time Required:** 5 minutes

```bash
# Step 1: Pull latest image
docker pull gcr.io/project-id/ecommerce-cli:latest

# Step 2: Stop old container
docker stop ecommerce-cli || true
docker rm ecommerce-cli || true

# Step 3: Create .env file
cat > /etc/ecommerce-cli/.env << EOF
CLI_ENV=production
API_URL=https://api.production.example.com/api
API_KEY=sk-prod-abc123...
BACKUP_RETENTION_DAYS=30
MAX_PARALLEL_WORKERS=10
PYTHONUNBUFFERED=1
EOF

# Step 4: Start container
docker run -d \
  --name ecommerce-cli \
  --env-file /etc/ecommerce-cli/.env \
  -v /data/ecommerce-cli/backups:/home/cli-user/.ecommerce-cli/backups \
  -v /data/ecommerce-cli/audit:/home/cli-user/.ecommerce-cli/audit \
  --restart unless-stopped \
  gcr.io/project-id/ecommerce-cli:latest

# Step 5: Verify running
docker ps | grep ecommerce-cli
docker logs ecommerce-cli

# Step 6: Test health
docker exec ecommerce-cli python main.py config --show
```

---

## Kubernetes Deployment (Staging)

### Scenario: Deploy to Staging K8s Cluster

**Time Required:** 20 minutes

**Prerequisites:**

```bash
# Verify kubectl access
kubectl cluster-info
kubectl get nodes

# Verify image in registry
gcloud container images list | grep ecommerce-cli
```

**Deployment Steps:**

```bash
# Step 1: Update staging image in manifests
sed -i 's|ecommerce-cli:.*|ecommerce-cli:v1.0.0|g' k8s/cli/*.yaml

# Step 2: Apply namespace and RBAC
kubectl apply -f k8s/cli/00-namespace.yaml

# Verify namespace created
kubectl get namespace ecommerce-cli

# Step 3: Update secrets for staging
kubectl create secret generic ecommerce-cli-secrets \
  --from-literal=api_key=sk-staging-abc123 \
  --from-literal=api_url=https://api-staging.example.com/api \
  -n ecommerce-cli \
  --dry-run=client -o yaml | kubectl apply -f -

# Step 4: Apply ConfigMap
kubectl apply -f k8s/cli/00-namespace.yaml
# (ConfigMap is defined in 00-namespace.yaml)

# Step 5: Apply storage
kubectl apply -f k8s/cli/30-storage.yaml
kubectl get pvc -n ecommerce-cli

# Step 6: Apply jobs
kubectl apply -f k8s/cli/10-jobs.yaml

# Step 7: Apply CronJobs
kubectl apply -f k8s/cli/20-cronjobs.yaml
kubectl get cronjob -n ecommerce-cli

# Step 8: Verify all objects created
kubectl get all -n ecommerce-cli

# Step 9: Test manual job run
kubectl create job test-batch-create \
  --from=job/batch-create -n ecommerce-cli

# Step 10: Monitor job
kubectl logs -n ecommerce-cli job/test-batch-create -f
```

**Post-Deployment Verification:**

```bash
# Check pod status
kubectl get pods -n ecommerce-cli

# Check recent job executions
kubectl get jobs -n ecommerce-cli -o wide

# View CronJob schedule
kubectl get cronjobs -n ecommerce-cli

# Check storage usage
kubectl exec -n ecommerce-cli <pod-name> -- \
  du -sh /home/cli-user/.ecommerce-cli/backups

# View recent audit events from pod
kubectl logs -n ecommerce-cli <pod-name> | tail -50
```

---

## Kubernetes Deployment (Production)

### Scenario: Promote Staging → Production

**Time Required:** 30 minutes (+ review time)  
**Risk Level:** HIGH

**Pre-Deployment:**

```bash
# Step 1: Health check staging cluster
kubectl get all -n ecommerce-cli --context=staging

# Step 2: List recent jobs that succeeded
kubectl get jobs -n ecommerce-cli --context=staging \
  -o jsonpath='{range .items[?(@.status.succeeded==1)]}{.metadata.name}{"\n"}{end}'

# Step 3: Export audit trail
kubectl exec -n ecommerce-cli <pod> --context=staging -- \
  python main.py audit view --json > audit-staging.json

# Step 4: Backup production databases
# (See DBA team for PostgreSQL/MongoDB backup)

# Step 5: Create production backup manually
kubectl create job backup-before-deploy \
  --from=job/backup-all -n ecommerce-cli \
  --context=production

# Monitor backup
kubectl logs -f -n ecommerce-cli job/backup-before-deploy \
  --context=production
```

**Deployment:**

```bash
# Step 1: Update production manifests
sed -i 's|ecommerce-cli:.*|ecommerce-cli:v1.0.0|g' k8s/cli/*.yaml

# Step 2: Apply to production (staging manifests under --context=production)
kubectl apply -f k8s/cli/00-namespace.yaml \
  --context=production

kubectl apply -f k8s/cli/10-jobs.yaml \
  --context=production

kubectl apply -f k8s/cli/20-cronjobs.yaml \
  --context=production

# Step 3: Monitor rollout
kubectl get all -n ecommerce-cli --context=production -o wide

# Step 4: Run health check job
kubectl create job health-check-post-deploy \
  --from=job/health-check-all -n ecommerce-cli \
  --context=production

# Monitor
kubectl logs -f -n ecommerce-cli job/health-check-post-deploy \
  --context=production
```

**Post-Deployment Verification:**

```bash
# Step 1: Verify all expected jobs exist
kubectl get jobs -n ecommerce-cli --context=production

# Step 2: Check next scheduled CronJob
kubectl get cronjobs -n ecommerce-cli --context=production -o wide

# Step 3: Verify storage is writable
kubectl exec -n ecommerce-cli <pod> --context=production -- \
  touch /home/cli-user/.ecommerce-cli/backups/test.txt

# Step 4: Check recent audit events
kubectl logs -n ecommerce-cli <pod> --context=production | grep "AUDIT" | tail -20

# Step 5: Verify backups are being created
kubectl exec -n ecommerce-cli <pod> --context=production -- \
  ls -lh /home/cli-user/.ecommerce-cli/backups/ | head -5

# Step 6: Notify team of successful deployment
# Include: deployment timestamp, version, health status
```

---

## Monitoring & Troubleshooting

### Scenario: Monitor Running Deployments

**Continuous Monitoring:**

```bash
# Watch all CLI pods (staging)
kubectl get pods -n ecommerce-cli --context=staging -w

# View logs for specific pod
kubectl logs -n ecommerce-cli <pod-name> \
  --context=staging -f --tail=100

# Get pod resource usage
kubectl top pod -n ecommerce-cli --context=staging

# Check node resource availability
kubectl top nodes --context=staging
```

### Scenario: Job is Failing

**Troubleshooting:**

```bash
# Step 1: Check job status
kubectl describe job <job-name> -n ecommerce-cli

# Step 2: View pod logs
kubectl logs <pod-name> -n ecommerce-cli --tail=200

# Step 3: Check events
kubectl get events -n ecommerce-cli --sort-by='.lastTimestamp'

# Step 4: Inspect pod configuration
kubectl get pod <pod-name> -n ecommerce-cli -o yaml

# Step 5: Check resource limits
kubectl describe node <node-name> | grep -A 5 "Allocated resources"

# Step 6: Common fixes
# - Not enough disk space: kubectl exec -n ecommerce-cli <pod> -- df -h
# - Network issue: kubectl exec -n ecommerce-cli <pod> -- curl http://api:3000/api/health
# - Permission issue: kubectl exec -n ecommerce-cli <pod> -- whoami
```

### Scenario: Health Check Fails

**Response Plan:**

```bash
# Step 1: Collect diagnostics
kubectl exec -n ecommerce-cli <pod> -- python main.py health check --all --full

# Step 2: Check specific shop
python main.py health check <shop-id> --full

# Step 3: Review recent audit
python main.py audit view --shop <shop-id> --limit 20

# Step 4: Check backup status
python main.py backup list <shop-id> | head -5

# Step 5: If recoverable, restore from backup
python main.py backup restore <shop-id> --dry-run
python main.py backup restore <shop-id>

# Step 6: Re-run health check
python main.py health check <shop-id> --full

# Step 7: Document incident
# Create incident ticket with:
# - Issue description
# - Root cause (if found)
# - Resolution actions
# - Audit trail screenshots
```

---

## Disaster Recovery

### Scenario: Deployment Failure - Rollback to Previous Version

**Time Required:** 10 minutes

```bash
# Step 1: Verify rollback is safe
# Check backup exists: kubectl get pvc -n ecommerce-cli
# Check audit backed up: /data/audit_backup.json exists

# Step 2: Delete failed deployment
kubectl delete all -n ecommerce-cli --all --context=production

# Step 3: Restore previous image
sed -i 's|ecommerce-cli:.*|ecommerce-cli:v0.9.0|g' k8s/cli/*.yaml

# Step 4: Reapply manifests
kubectl apply -f k8s/cli/00-namespace.yaml --context=production
kubectl apply -f k8s/cli/10-jobs.yaml --context=production
kubectl apply -f k8s/cli/20-cronjobs.yaml --context=production

# Step 5: Verify rollback
kubectl get all -n ecommerce-cli --context=production

# Step 6: Run health check
kubectl create job rollback-verification \
  --from=job/health-check-all \
  -n ecommerce-cli --context=production

kubectl logs -f -n ecommerce-cli job/rollback-verification \
  --context=production

# Step 7: Notify team
# Message: "Rollback successful. Now investigating root cause."
```

### Scenario: Data Corruption - Restore from Backup

**Time Required:** 30 minutes

```bash
# Step 1: Identify affected shops
# From health check failures or audit trail
python main.py audit view --status failed | grep -E "shop_id|action"

# Step 2: List available backups
python main.py backup list <affected-shop-id> | head -10

# Step 3: Choose backup timestamp (before corruption)
# Use oldest good backup timestamp: 20260405_090000

# Step 4: Dry-run restore
python main.py backup restore <affected-shop-id> \
  --timestamp 20260405_090000 \
  --dry-run

# Step 5: Verify data looks correct
# If OK, proceed. If not, try earlier timestamp.

# Step 6: Execute restore
python main.py backup restore <affected-shop-id> \
  --timestamp 20260405_090000

# Step 7: Verify restoration
python main.py health check <affected-shop-id> --full

# Step 8: Check audit trail
python main.py audit view --shop <affected-shop-id> --limit 10

# Step 9: Document recovery
# Log in incident ticket:
# - What was corrupted
# - Backup timestamp used
# - Verification steps
# - Data loss scope (if any)
```

### Scenario: Disk Space Emergency

**Time Required:** 5 minutes

```bash
# Step 1: Check current usage
kubectl exec -n ecommerce-cli <pod> -- df -h | grep -E "Avail|cli-user"

# Step 2: Clean old backups (auto-cleanup)
python main.py backup cleanup --auto

# Verify cleanup
du -sh ~/.ecommerce-cli/backups

# Step 3: Export old audit to external storage
python main.py audit view --json > /mnt/archive/audit_$(date +%Y%m%d).json

# Step 4: Clear local audit (if retention expired)
# Before doing this:
# - Verify export succeeded
# - Verify external storage has copy
# - Get approval from platform admin

python main.py audit cleanup --retention-days 30

# Step 5: Verify space restored
df -h /home/cli-user/.ecommerce-cli

# Step 6: Monitor going forward
# Set alert if usage > 80%
```

---

## Maintenance Procedures

### Weekly Maintenance (Every Monday 2 AM UTC)

```bash
#!/bin/bash
# Run this script via cron: 0 2 * * 1

# Backup all shops
kubectl --context=production exec -it deployment/cli -- \
  python main.py backup create --all

# Health check all shops
kubectl --context=production exec -it deployment/cli -- \
  python main.py health check --all

# Export audit trail
kubectl --context=production exec -it deployment/cli -- \
  python main.py audit view --json > /data/audit_weekly.json

# Send report
mail -s "Weekly maintenance report" ops@example.com < /tmp/maintenance_report.txt
```

### Monthly Maintenance (1st of month, 1 AM UTC)

```bash
#!/bin/bash

# 1. Archive old backups to cold storage
gsutil -m cp -r gs://ecommerce-backups/old/* \
  gs://ecommerce-backups-archive/

# 2. Verify backup integrity
for backup in ~/.ecommerce-cli/backups/*/; do
  sha256sum -c "${backup}/checksum.txt"
done

# 3. Update security patches
docker pull gcr.io/project-id/ecommerce-cli:latest
docker push gcr.io/project-id/ecommerce-cli:latest

# 4. Run full security scan
trivy image --severity HIGH,CRITICAL gcr.io/project-id/ecommerce-cli:latest

# 5. Audit role usage (AGENTS.md compliance)
python main.py audit view --json | jq -r '.role' | sort | uniq -c

# 6. Generate compliance reports
python scripts/generate_compliance_report.py
```

### Quarterly Maintenance (Q4 1st, 1 AM UTC)

```bash
# 1. Review and optimize K8s resources
kubectl top nodes --context=production
kubectl top pods -A --context=production | sort -k 3 -nr | head

# 2. Update manifests for new features
# Review PHASE5_IMPLEMENTATION.md for changes
grep "Status: New" AGENTS.md | while read role; do
  # Add new role to k8s manifests if needed
done

# 3. Test disaster recovery procedures
# Perform full rollback test in staging
bash scripts/test_rollback.sh --context=staging

# 4. Review audit policies
python main.py audit summary --period=90 > audit_quarterly_review.json

# 5. Team training on new features
# Reference: PHASE5_IMPLEMENTATION.md
```

---

## Deployment Automation (GitHub Actions)

### CI/CD Pipeline Stages

```yaml
# .github/workflows/cli-deploy.yml structure:

1. Build
   - Run tests
   - Lint code
   - Build Docker image
   - Push to registry

2. Deploy to Staging
   - SSH to staging K8s
   - Apply manifests
   - Run health check
   - Wait for stabilization

3. Approval Gate (Manual)
   - Human review required
   - Check staging health
   - Review audit changes

4. Deploy to Production
   - SSH to production K8s
   - Apply manifests
   - Monitor health
   - Notify team

5. Post-Deployment
   - Verify backups running
   - Confirm monitoring active
   - Archive deployment logs
```

---

## Quick Reference

### Common Commands Cheat Sheet

```bash
# Local Development
docker-compose up -d
docker-compose down
docker-compose logs -f cli-tool

# Staging K8s
kubectl get all -n ecommerce-cli --context=staging
kubectl logs -f -n ecommerce-cli <pod> --context=staging
kubectl exec -n ecommerce-cli <pod> --context=staging -- python main.py --help

# Production K8s
kubectl get all -n ecommerce-cli --context=production
kubectl logs -f -n ecommerce-cli <pod> --context=production

# Backups
python main.py backup list <shop-id>
python main.py backup create <shop-id>
python main.py backup restore <shop-id>

# Monitoring
python main.py health check --all
python main.py audit view --limit 50
python main.py config --show
```

---

## Rollback Decision Tree

```
Is deployment failing?
├─ YES, within 5 min of deploy
│   └─ ROLLBACK to previous version
│       └─ Run: kubectl delete all -n ecommerce-cli
│       └─ Reapply v0.9.0 manifests
│
├─ YES, but >5 min since deploy
│   └─ Check: Is backup recovery better?
│       ├─ Data corrupted → RESTORE from backup
│       ├─ Config issue → ROLLBACK + investigate
│       └─ Unknown → Ask platform team
│
└─ NO, working but degraded
    └─ MONITOR for now, prepare rollback plan
    └─ Get approval for any changes
```

---

## Support & Escalation

### Escalation Path

```
Issue Level | First Contact | Duration | Escalate To
-----------|--------------|----------|-------------
P4 (Dev)   | Team lead    | 24h      | N/A
P3 (Staging) | Ops engineer | 4h      | Platform admin
P2 (Prod)  | Platform admin | 1h      | VP Engineering
P1 (Critical) | On-call   | 15 min   | CTO
```

### On-Call Guidance

- **First 15 minutes:** Confirm issue, check status pages, gather logs
- **15-30 minutes:** Attempt fix, check runbooks (this document), execute fix
- **30-60 minutes:** Implement workaround or rollback, notify stakeholders
- **60+ minutes:** Full incident escalation, war room setup, root cause analysis

---

**Last Updated:** April 6, 2026  
**Maintained By:** Platform Operations Team  
**Version:** 1.0

Next Review: June 6, 2026
