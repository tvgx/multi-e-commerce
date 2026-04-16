# 🏗️ Infrastructure — Rollback & Recovery

Recovering from failed deployments, data corruption, and disasters.

---

## Causes of Rollback

| Cause | Severity | Action |
|-------|----------|--------|
| Pod crashes (CrashLoopBackOff) | Critical | Immediate rollback |
| High error rate (> 5%) | Critical | Immediate rollback |
| Database migration failed | Critical | Restore from backup + rollback |
| Memory leak detected | High | Rollback, investigate |
| API latency spike (> 2s) | High | Assess impact, rollback if widespread |
| Minor bug discovered | Medium | Rollback or hotfix (choose one) |

---

## Quick Rollback (1 Deployment)

### Option 1: kubectl rollout undo

Fastest rollback using Kubernetes history:

```bash
# Check deployment revision history
kubectl rollout history deployment/api-core -n ecommerce

# Output:
# REVISION  CHANGE-CAUSE
# 1          kubectl set image deployment/api-core...
# 2          kubectl apply -f k8s/apps/api-core.yaml
# 3          kubectl set image deployment/api-core... [current, FAILING]

# Rollback to previous revision (rev 2)
kubectl rollout undo deployment/api-core -n ecommerce

# Or rollback to specific revision
kubectl rollout undo deployment/api-core -n ecommerce --to-revision=2

# Monitor rollback
kubectl rollout status deployment/api-core -n ecommerce --watch
```

**When to use**: Quick rollback of container image only (no DB changes)

### Option 2: Re-apply Previous Manifest

More explicit approach:

```bash
# Save current manifest (for diagnosis)
kubectl get deployment api-core -n ecommerce -o yaml > /tmp/current-manifest.yaml

# Re-apply previous version from git
git show HEAD~1:k8s/apps/api-core.yaml | kubectl apply -f -

# Or use kubectl diff first to preview
git show HEAD~1:k8s/apps/api-core.yaml | kubectl diff -f -
```

**When to use**: Config or manifest changes need to be undone

---

## Handling Database Migration Rollback

### Pre-Deployment Backup (Automated)

```bash
# Daily backup runs automatically at 2 AM UTC
# Check backup status:
kubectl get cronjob daily-backup -n ecommerce
kubectl get jobs -n ecommerce | grep backup

# List backups
python main.py backup list

# Output:
# ID                    | Timestamp           | Size    | Status
# backup-20260407-020000| 2026-04-07 02:00 UTC| 2.4 GB  | completed
```

### Restore from Backup

**Scenario**: Migration corrupted data; need to restore DB

```bash
# 1. Check backup availability
python main.py backup list --from=2026-04-06 --to=2026-04-07

# 2. Container image rollback (first)
kubectl rollout undo deployment/api-core -n ecommerce

# 3. Stop API pods (to prevent writes during restore)
kubectl scale deployment api-core --replicas=0 -n ecommerce

# 4. Restore database
python main.py backup restore \
  --backup-id backup-20260407-020000 \
  --environments postgres,mongodb

# Expected output:
# Restoring backup-20260407-020000...
# PostgreSQL restored (185 tables)
# MongoDB restored (42 collections)
# Restore complete (took 15 minutes)

# 5. Verify restore integrity
kubectl exec pod/api-core-xxx -n ecommerce -- \
  npm run db:check

# 6. Restart API pods
kubectl scale deployment api-core --replicas=3 -n ecommerce

# 7. Monitor rollout
kubectl rollout status deployment/api-core -n ecommerce --watch
```

**Risks to manage**:
- ⏱️ Data loss: All changes since backup are lost
- 🔒 Locks: Restore may lock tables (plan for 30+ min downtime)
- 📊 Consistency: Verify data consistency after restore

---

## Full System Rollback (Multi-Component)

**Scenario**: Breaking changes across multiple apps; need to rollback all

```bash
# 1. Check git history
git log --oneline -10

# 2. Identify last good state
# (Usually last deployment that was stable for 30+ min)

# 3. Rollback all deployments
kubectl rollout undo deployment/admin -n ecommerce
kubectl rollout undo deployment/api-core -n ecommerce
kubectl rollout undo deployment/storefront -n ecommerce

# 4. Restore database (if needed)
python main.py backup restore --backup-id backup-20260406-xxx

# 5. Verify all components
curl https://admin.example.com/health
curl https://api.example.com/health
curl https://shop.example.com/health

# 6. Test critical flows
# Log in to admin
# Create product
# Visit storefront
# Place order

# 7. Notify stakeholders
# "Rollback completed. System stable."
```

---

## Disaster Recovery (Data Loss)

### If Data Is Corrupted/Lost

```bash
# 1. Identify corruption
kubectl logs deployment/api-core -n ecommerce | grep -i "corrupted\|lost\|corrupt"

# 2. Find point-in-time before corruption
# Check backup timeline and logs
python main.py backup list --from=2026-04-01 --to=2026-04-07

# 3. Restore to pre-corruption backup
python main.py backup restore \
  --backup-id backup-20260406-120000 \
  --verify-integrity  # Extra safety check

# 4. Verify data
python main.py schema check --full
kubectl exec pod/api-core-xxx -n ecommerce -- npm run db:validate

# 5. Replay backups
# If needed, can replay transactions from transaction log
# between backup point and now
python main.py backup replay-transactions \
  --from=2026-04-06 \
  --to=2026-04-07
```

### If Database is Completely Down

```bash
# 1. Check cluster status
az aks show --name ecommerce-prod --resource-group ecommerce \
  --query provisioningState -o tsv

# 2. If cluster is down, spin up new cluster
az aks create --name ecommerce-prod-recovery \
  --resource-group ecommerce \
  --admin-enabled

# 3. Restore from backup
python main.py backup restore \
  --backup-id backup-20260406-xxx \
  --cluster ecommerce-prod-recovery

# 4. Update DNS to point to new cluster
az network dns record-set a update \
  --resource-group ecommerce \
  --zone-name example.com \
  --name api \
  --ipv4-address <new-cluster-ip>

# 5. RTO (Recovery Time Objective): ~2 hours
# RPO (Recovery Point Objective): 24 hours
```

---

## Prevention & Best Practices

### Pre-Deployment Testing

```bash
# Always test in staging first
# 1. Deploy to staging
./scripts/deploy.sh staging

# 2. Run smoke tests
npm run test:integration -- --env=staging

# 3. Monitor for 1 hour
# Check error rate, latency, DB health

# 4. Only then deploy to production
./scripts/deploy.sh production
```

### Feature Flags

Use feature flags to enable/disable features without redeployment:

```typescript
// If new feature is risky, wrap in feature flag
if (featureFlags.enabled('new-checkout')) {
  return newCheckoutFlow();
} else {
  return legacyCheckoutFlow();
}
```

**Disable at runtime**:
```bash
# Update feature flag config (without deployment)
kubectl patch configmap feature-flags \
  -p '{"data": {"new-checkout": "false"}}' \
  -n ecommerce
```

### Canary Deployments

Deploy to subset of traffic first:

```bash
# Deploy to 10% of traffic
kubectl patch deployment api-core \
  -p '{"spec": {"strategy": {"type": "Canary", "canary": {"weight": 10}}}}'

# Monitor metrics for 15 min
# If good, increase to 50%, then 100%
```

---

## Rollback Checklist

Immediate actions:
- [ ] Declare incident (Slack, PagerDuty)
- [ ] Stop deployment immediately
- [ ] Identify which component failed
- [ ] Check if data was modified (need restore?)
- [ ] Execute rollback (kubectl rollout undo or restore from backup)
- [ ] Verify health checks passing
- [ ] Test critical flows

Follow-up:
- [ ] Post-mortem meeting scheduled
- [ ] Root cause analysis
- [ ] Preventive measures documented
- [ ] Update rollback procedures if needed

---

See [README.md](README.md) | [deployment-procedure.md](deployment-procedure.md)
