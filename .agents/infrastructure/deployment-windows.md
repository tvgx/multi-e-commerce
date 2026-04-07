# 🏗️ Infrastructure — Deployment Windows & Change Management

Change control, maintenance windows, and communication.

---

## Deployment Windows

### Production Change Window

**When you CAN deploy**:
- Weekdays only: Monday–Thursday
- Hours: 09:00–16:00 UTC (US EST: 04:00–11:00 or 05:00–12:00 EDT)
- Buffer: Must complete 1 hour before shift end (by 15:00 UTC)

**When you CANNOT deploy**:
- Fridays after 15:00 UTC (weekend approaching)
- Weekends (Saturday–Sunday)
- Holidays & holidays week (no deployments Fri-Mon around holidays)
- Release week (weekly release on Wed; frozen Mon–Sat except Tue patch)

### Staging Window

**Anytime**, but:
- Coordinate with team (Slack #deployments)
- Run during non-peak hours if possible
- Can't deploy during prod change window (avoid interference)

### Emergency Deployments (Out-of-Hours)

**"Code Red" incidents only**:
- Data loss detected
- Security breach / payment processing down
- Service completely unavailable (> 30 min)

**Process**:
1. Declare incident in #incidents Slack channel
2. Get 2-person approval (on-call lead + SRE)
3. Create incident ticket (timestamp + approvers)
4. Deploy with full monitoring
5. Post-mortem required next business day

---

## Pre-Deployment Announcement

### 1. Slack Notification (24 hours before)

```
📢 **Scheduled Maintenance Window**

Component: API Core
Version: v1.2.3
Scope: Database schema upgrade
Impact: Possible 5–10 min latency spike, no downtime expected
Time: 2026-04-08 14:00 UTC (Tue)
Duration: ~30 minutes
Approvals: ✅ @tech-lead ✅ @ops

Contact: @oncall-sre if issues
```

### 2. Email to Customers (if applicable)

For high-impact changes affecting shop owners:

```
Subject: Scheduled Maintenance - April 8, 2026

Dear Shop Partners,

We'll be upgrading our platform on Tuesday, April 8 at 14:00 UTC.
Expected duration: 30 minutes.
Impact: Possible brief latency during upgrade window.

No action required from you. Your shops will be back to normal speed once complete.

Thank you,
Engineering Team
```

### 3. Update Status Page

If you have a status page (Statuspage.io / Atlassian):
- [ ] Mark maintenance window
- [ ] Set expected duration
- [ ] Set notification emails
- [ ] Schedule status updates

---

## Change Control Ticket

### Create Ticket (Jira / GitHub Issues)

```
Title: [DEPLOY] API Core v1.2.3 - Database schema upgrade

Description:
- Changes: Async product indexing, 15% faster searches
- Risk: Database schema change (reversible)
- Rollback: Available (to v1.2.2)
- Approvals needed: 2 (tech lead, ops)

Testing:
- ✅ All unit tests passing (1200+ tests)
- ✅ Integration tests passing (staging)
- ✅ Performance tests: 15% improvement verified
- ✅ Smoke tests: 2+ hours in staging

Deployment Plan:
1. Backup database (auto)
2. Update API pods (rolling restart)
3. Run database migrations
4. Verify health checks
5. Smoke tests (5+ flows)

Rollback Plan:
1. kubectl rollout undo deployment/api-core
2. Restore database from backup
3. Verify health

Metrics to Monitor:
- Error rate (target: < 1%)
- Response latency (target: < 500ms p95)
- Pod restarts (target: 0)
- Database CPU (target: < 80%)
```

### Approvals

Before deployment, get sign-off:

```
Approver Type      | Username      | Status | Approved
Technical Review   | @tech-lead    | ✅     | 2026-04-07 10:30
Operations Review  | @ops-lead     | ✅     | 2026-04-07 10:45
Security Review    | @security     | ✅     | 2026-04-07 11:00 (auto-approved, no security changes)
Product Review     | @product      | ⏳     | (not needed, internal perf improvement)
```

---

## During Deployment

### Deployment Runbook

```bash
# Scheduled for: 2026-04-08 14:00 UTC
# Scheduled by: @john
# Monitoring: @on-call

# T+0: Start (14:00 UTC)
echo "Starting API Core v1.2.3 deployment"
./scripts/deploy.sh production api-core v1.2.3

# T+5: Verify pods
kubectl get pods -n ecommerce -l app=api-core -w

# T+10: Run migrations (if needed)
kubectl exec pod/api-core-xxx -n ecommerce -- npm run migrate:up

# T+15: Smoke tests
curl https://api.example.com/health
curl https://api.example.com/api/products | head -10

# T+20: Verify metrics (check Grafana)
# CPU: < 80%
# Memory: < 75%
# Error rate: < 1%
# Latency p95: < 500ms

# T+25: Announce in Slack
Post: "✅ API Core v1.2.3 deployed successfully"

# T+60: Final verification
# Monitor for next 1 hour
```

### Communication During Deployment

**Slack channel: #deployments-live**

```
14:00 - 🟡 Deployment starting: API Core v1.2.3
14:05 - 🟡 Pods rolling out (1/3 ready)
14:10 - 🟡 Database migrations running
14:15 - 🟢 Migrations complete
14:20 - 🟢 All health checks passing
14:25 - 🟢 Smoke tests passed
14:30 - 🟢 ✅ Deployment complete, monitoring
15:00 - 🟢 ✅ Final verification passed - deployment COMPLETE
```

---

## Post-Deployment

### 1. Update Ticket

```
Status: DEPLOYED
Deployed: 2026-04-08 14:30 UTC
Version: v1.2.3
Duration: 30 minutes
Issues: None
Metrics: All nominal
Post-mortem: Not needed
```

### 2. Release Notes / Changelog

```markdown
## [v1.2.3] - 2026-04-08

### Added
- Async product indexing for 15% faster searches
- New analytics export endpoints

### Fixed
- Bug: Cart not updating on variant change

### Changed
- Database schema v5 (reversible migration)

### Performance
- Search latency: 50ms → 42ms avg
- Index rebuild: 2 hours → 30 min

### Deployment Notes
- Database migration required
- Zero-downtime rolling update
- Tested in staging 2026-04-07
```

### 3. Monitoring (Next 2 Hours)

Stay alert for:
- Unexpected error spikes
- Memory leaks (gradual increase)
- Database connection pool exhaustion
- Slow queries from new code

```bash
# Real-time monitoring
watch kubectl top pods -n ecommerce

# Log monitoring
kubectl logs deployment/api-core -n ecommerce -f | grep -E "ERROR|WARN"

# Check customer reports
# Monitor #customer-support channel for complaints
```

---

## Deployment Checklist

**Before (24+ hours)**:
- [ ] Change ticket created & approved
- [ ] Slack notification posted
- [ ] Status page updated (if applicable)
- [ ] Customer email sent (if applicable)
- [ ] Runbook reviewed
- [ ] Rollback procedure tested in staging

**Before (1 hour)**:
- [ ] All approvals obtained
- [ ] Backup completed
- [ ] Monitoring dashboards open
- [ ] Team ready (no other deployments in progress)

**During**:
- [ ] Live communication in #deployments-live
- [ ] Health checks monitored
- [ ] Metrics reviewed
- [ ] Ready to rollback if needed

**After (1 hour)**:
- [ ] Final verification complete
- [ ] Ticket updated
- [ ] Release notes posted
- [ ] Team celebration! 🎉

---

## Common Issues & Resolutions

| Issue | Cause | Resolution |
|-------|-------|-----------|
| Pod crash loop | Bad config | Rollback immediately, review logs |
| DB migration timeout | Large table | Kill migration, restore backup, plan longer window |
| High latency spike | Indexing | Wait for index rebuild, increase timeout, or rollback |
| Memory leak detected | Code issue | Rollback, create hotfix PR, re-deploy next window |
| DNS not updated | Old cache | Wait 5–10 min, or manually flush cache |

---

See [README.md](README.md) | [deployment-procedure.md](deployment-procedure.md) | [rollback.md](rollback.md)
