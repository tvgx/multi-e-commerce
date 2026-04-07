# 🚨 Escalation — On-Call Procedures

Managing on-call rotations, handoffs, and incident response.

---

## On-Call Rotation

### Schedule

**Primary on-call**: 1 week (Mon–Sun)
**Secondary on-call**: 1 week (backup, handles P2/P3)

**Calendar**: [On-Call Schedule Link]

```
Week of April 7, 2026:
Primary:   @john (Mon-Sun)
Secondary: @alice (Mon-Sun)

Week of April 14, 2026:
Primary:   @bob (Mon-Sun)
Secondary: @charlie (Mon-Sun)
```

### Responsibilities by Role

#### Primary On-Call

- Responds to P1/P2/P3 incidents
- First point of contact for urgent issues
- Available 24/7
- Expected response time: < 15 min for P1

#### Secondary On-Call

- Responds to P2/P3 incidents (primary unavailable)
- Assists primary on P1
- Available 24/7
- Expected response time: < 30 min for P2

---

## Escalation Scenarios

### P1 Incident (Critical)

```
Automated alert → Slack notification
    ↓
Primary on-call paged (PagerDuty)
    ↓
T+5 min: No response? → Page secondary
    ↓
T+10 min: Both paged? → Page team lead + manager
    ↓
T+15 min: Incident commander assigned
    ↓
T+30 min: Still no solution? → CTO/VP Eng engaged
```

**Example PagerDuty alert**:

```
🚨 CRITICAL: Database Unavailable

Service: PostgreSQL
Status: DOWN
Duration: 2 minutes
Impact: All shops affected

⚠️ PAGING: Primary on-call (@john)
Response required immediately

Runbook: [database-runbook-link]
Dashboard: [monitoring-dashboard-link]
```

### P2 Incident (High)

```
Alert in Slack #alerts

Primary on-call reviews
    ↓
30+ min without progress? → Page secondary
    ↓
Still ongoing T+1 hour? → Notify team lead
```

---

## During Incident

### Communication Protocol

**Primary on-call responsibilities**:

1. **Acknowledge immediately** (Slack or PagerDuty)
   ```
   @on-call I'm investigating. Will update in 5 min.
   ```

2. **Update every 15 minutes** (if P1/P2)
   ```
   Status: Still investigating
   Hypothesis: API memory leak
   ETA: 15 more minutes
   ```

3. **Escalate if stuck**
   ```
   Escalating to @team-lead - need input on X
   ```

4. **Final update**
   ```
   ✅ RESOLVED at 14:55 UTC
   Root cause: Disk full
   Impact: 25 min downtime
   Post-mortem: Tomorrow at 10 AM
   ```

### Incident Command

**For P1 incidents**, use incident commander:

```bash
# Slack command
/incident start P1 "Database down" @john
# Creates incident channel: #incident-database-down-20260407

# In incident channel:
/incident status    # Show incident status
/incident list      # List ongoing incidents
/incident end       # Close incident (post-mortem scheduled)
```

---

## Tools & Access

### Required Before On-Call Shift

- [ ] PagerDuty app installed (phone + laptop)
- [ ] VPN access working
- [ ] SSH keys updated
- [ ] kubectl context switched to production
- [ ] API credentials refreshed
- [ ] Database credentials cached (or secure method)
- [ ] Monitor dashboards bookmarked
- [ ] Runbooks reviewed

### Useful Tools

```bash
# Quick diagnostics
kubectl get pods -n ecommerce         # Pod status
kubectl logs deployment/api-core      # Streaming logs
kubectl describe pod/<pod-name>       # Pod details
kubectl top nodes                     # Node usage

# Database
python main.py health check --full    # Comprehensive checks
psql $DATABASE_URL -c "SELECT version();"  # DB status
mongo $MONGODB_URL --eval "db.serverStatus()"  # Mongo status

# API
curl https://api.example.com/health   # Health check
curl https://api.example.com/ready    # Readiness check
```

---

## Handoff Procedure

### End of Shift Handoff

**Time**: 15 minutes before end (e.g., Sunday 23:45 UTC for Mon handoff)

**Location**: Slack #on-call-handoff thread

**Template**:

```
@next-on-call Handing off

🔴 Active Incidents:
- None

🟠 Ongoing Issues (In Progress):
- API latency spike: Investigating memory leak
  - Owner: @bob (follow up Monday morning)
  - Slack thread: [link]
  
🟡 Heads Up:
- Database backup running Monday (normal, no action)
- Large batch job starting Tuesday (may cause spike)
- Monitoring update deploying Monday evening

📊 Stats (This Shift):
- P1 incidents: 0
- P2 incidents: 1 (resolved)
- P3 incidents: 2
- Total on-call time: ~20 min

📋 To Know:
- Backup alert flaky (disable if fires)
- Contact info for @alice if issues: [phone/slack]

Questions? I'm still available for 15 min.
```

### Start of Shift

**Time**: Shift start (e.g., Monday 00:00 UTC)

**Actions**:
1. [ ] Review handoff message
2. [ ] Skim recent incident threads
3. [ ] Check for any overnight issues
4. [ ] Update Slack status: "On-Call 🚨"
5. [ ] Verify PagerDuty alert active
6. [ ] Reply to handoff: "Got it. Thanks! I have it now."

---

## Incident Response Runbook

### Database Down (PostgreSQL)

```bash
# Confirm the issue
curl https://api.example.com/health
# Expected: 500 error or timeout

# Check database
kubectl exec deployment/api-core -n ecommerce -- \
  node -e "require('pg').Client('$DATABASE_URL').connect((e) => console.log(e ? 'DOWN' : 'UP'))"

# Check K8s events
kubectl describe svc postgres -n ecommerce
kubectl get events -n ecommerce --sort-by='.lastTimestamp'

# Check database logs
kubectl logs statefulset/postgres -n ecommerce | tail -20

# Common fixes:
# 1. Restart pod
kubectl rollout restart statefulset/postgres -n ecommerce

# 2. Check disk space
kubectl exec statefulset/postgres -- df -h /var/lib/postgresql

# 3. Check connections
kubectl exec statefulset/postgres -- psql -c "SELECT count(*) FROM pg_stat_activity;"

# If still down, escalate to DBA/cloud team
@cloud-team Database down, may need manual intervention
```

### API Memory Leak

```bash
# Check memory usage
kubectl top pods -n ecommerce -l app=api-core

# Expected: ~200-300MB per pod
# If > 500MB: Potential leak

# Check logs for leaks
kubectl logs deployment/api-core -n ecommerce | grep -i "memory\|leak"

# Restart pods (temporary fix)
kubectl rollout restart deployment/api-core -n ecommerce

# Monitor after restart
watch kubectl top pods -n ecommerce -l app=api-core

# If still growing, escalate to engineering
@engineering API pods reaching 500MB (potential leak)
Current version: [version]
Start time: [time]
```

---

## Emergency Contact Tree

```
P1 Incident
    ├─ Slack: #incidents-live (immediate notify)
    ├─ Primary on-call → @john
    │   ├─ Phone: +1-555-0100
    │   └─ Unavailable → Secondary: @alice
    ├─ Team lead: @manager (if > 10 min)
    ├─ Manager: @director (if > 20 min)
    └─ CTO: @cto (if > 30 min)
```

---

## Checklist: Starting On-Call Shift

- [ ] PagerDuty alerts enabled (phone + laptop)
- [ ] Reviewed handoff message
- [ ] Checked recent logs for issues
- [ ] Updated Slack status
- [ ] Verified VPN + SSH access
- [ ] Database credentials cached securely
- [ ] Production kubectl context verified
- [ ] Dashboards open + monitored
- [ ] Runbooks bookmarked
- [ ] Contact info updated (phone, addresses)

---

See [README.md](README.md) | [support-levels.md](support-levels.md) | [incident-response.md](incident-response.md)
