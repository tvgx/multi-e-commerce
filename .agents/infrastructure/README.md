# 🏗️ Infrastructure — README & Key Files

Kubernetes, Docker, deployment, rollback, monitoring.

---

## Quick Reference

**Deployment procedure**: Step-by-step from code → staging → production  
**Environments**: dev → acceptance → staging → production (one-way promotion)  
**Deployment window**: Production 09:00–17:00 UTC only (emergency exception possible)  
**Rollback**: If deploy fails within 30 min, auto-revert  

---

## Files in This Section

1. **environments.md** — dev/acceptance/staging/prod hierarchy
2. **manifests.md** — K8s YAML structure, resource rules, image tagging
3. **deployment-procedure.md** — Step-by-step deploy to each environment
4. **rollback.md** — Failure recovery, kubectl rollout undo
5. **deployment-windows.md** — Prod windows, change control, out-of-hours

---

## Deployment Checklist

Before deploying to production:

- [ ] Code merged to main (via PR, all tests passing)
- [ ] Docker images built + pushed to registry
- [ ] Tested on staging (smoke tests, health checks pass)
- [ ] Rollback plan documented (image hash, kubectl command)
- [ ] Approvals obtained (2 reviewers if K8s manifest change)
- [ ] Deployment window (09:00–17:00 UTC Mon–Fri)
- [ ] Team notified (Slack #deployments)
- [ ] Monitoring active (Grafana, alerts enabled)
- [ ] Post-deploy: monitor 30 min for issues

---

## Key Commands

```bash
# Deploy new version
kubectl set image deployment/api-core \
  api-core=<registry>/api-core:v2.3.0-<hash>
kubectl rollout status deployment/api-core --timeout=10m

# Rollback on failure
kubectl rollout undo deployment/api-core
kubectl rollout status deployment/api-core --timeout=10m

# Monitor deployment
kubectl get pods
kubectl logs deployment/api-core

# Check resource usage
kubectl top nodes
kubectl top pods -n ecommerce-cli
```

---

## Next → See Detailed Sections

- [environments.md](environments.md) — understand env hierarchy
- [manifests.md](manifests.md) — K8s YAML best practices
- [deployment-procedure.md](deployment-procedure.md) — deploy step-by-step
- [rollback.md](rollback.md) — fix failures fast
