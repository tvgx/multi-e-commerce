# 🚨 Escalation — Support Levels & Severity

Defining incident severity, support levels, and response times.

---

## Severity Levels

### 🔴 P1 (Critical / SEV1)

**System is down or severely degraded**

Examples:
- Database completely down (0% availability)
- All shops unavailable (API 500 errors)
- Payment processing broken
- Data corruption detected
- Security breach detected

**Response Time**: Immediate (< 5 min) — Page on-call
**Resolution Target**: < 1 hour
**Escalation**: CTO notified, all hands on deck

**Declare P1**:
```bash
# In Slack #incidents
@incident-commander SEV1: Database down
Component: PostgreSQL
Impact: All 1,200 shops offline
Started: 2026-04-07 14:30 UTC

/pagerduty trigger P1 incident
```

---

### 🟠 P2 (High / SEV2)

**Service degraded but not completely down**

Examples:
- API latency spike (> 2 seconds)
- Error rate elevated (> 5%)
- 10–50% of shops affected
- Admin dashboard slow
- Batch operations failing

**Response Time**: Within 15 min — Page engineer
**Resolution Target**: < 4 hours
**Escalation**: Engineering manager notified

**Example**:
```bash
# In Slack #incidents
P2: API latency spike
Current: 2.8s (target 500ms)
Impact: 15% of shops slow
Duration: 8 minutes
Status: Investigating
```

---

### 🟡 P3 (Medium / SEV3)

**Minor impact, workaround available**

Examples:
- Email notifications delayed (< 1 hour)
- UI bug (non-revenue impacting)
- One API endpoint slow (others fine)
- Monitoring alert flapping
- < 5% of shops affected

**Response Time**: Within 4 hours
**Resolution Target**: < 24 hours
**Escalation**: Team lead assigned

**Example**:
```bash
# In Slack #alerts
P3: Email notifications delayed
Component: SendGrid API
Impact: < 1% of shops
Workaround: Manual resend available
ETA: 2 hours
```

---

### 🔵 P4 (Low / SEV4)

**No impact on users; internal/cosmetic**

Examples:
- Monitoring alerts (non-actionable)
- UI typos
- Documentation outdated
- Log warning (non-critical)
- Build flake (passes on retry)

**Response Time**: Next business day
**Resolution Target**: 1 week
**Escalation**: Not escalated

**Example**:
```bash
# Create GitHub issue
Title: UI typo in settings page
Severity: P4
Component: admin-dashboard
```

---

## Support Response Matrix

| Level | On-Call | Response | Resolution | Example |
|-------|---------|----------|-----------|---------|
| **P1** | Yes | < 5 min | < 1 hour | System down |
| **P2** | Yes | 15 min | < 4 hours | Major degradation |
| **P3** | No | 4 hours | < 24 hours | Minor impact |
| **P4** | No | Next day | < 1 week | Cosmetic |

---

## Support Channels

### During Business Hours (09:00–17:00 UTC)

**P1/P2**: 
- Slack channel: #incidents-live
- @incident-commander
- Escalate to: On-call engineer → Manager → CTO

**P3**:
- Slack channel: #alerts
- Create GitHub issue (can wait for next standup)

**P4**:
- GitHub issue
- Slack (optional, can batch)

### After Hours (17:00–09:00 UTC)

**P1/P2**:
- Check PagerDuty
- On-call engineer paged immediately
- 24/7 support

**P3/P4**:
- Log for next business day
- Handle by on-call engineer only if urgent

---

## Incident Declaration & Escalation

### Declare Incident

**When to declare**:
- P1/P2 severity
- Multiple teams involved
- Unclear root cause
- > 15 min outage

**How to declare**:
```bash
# In Slack
@incident-commander declare incident P1/P2

# Triggers:
# - Incident thread created
# - Incident number assigned (INC-2026-0123)
# - Stakeholders notified
# - Statuspage updated
```

### Escalation Flow

```
Engineer detects issue
    ↓
Slack alert (immediate)
    ↓
P1/P2? → Page on-call
    ↓
Incident thread started
    ↓
5 min: No improvement? → Escalate to team lead
    ↓
10 min: Still ongoing? → Escalate to manager
    ↓
20 min: Still ongoing? → Escalate to CTO/VP Eng
```

### Example Incident Escalation

```
14:30 UTC: Database error detected (automated alert)
14:32 UTC: Engineer on-call reviews, confirms P1
14:32 UTC: Slack: "SEV1: Database unreachable"
14:33 UTC: PagerDuty page sent
14:34 UTC: Secondary on-call notified
14:37 UTC: Manager + CTO in incident channel
14:45 UTC: Root cause found (disk full)
14:50 UTC: Database restarted successfully
15:00 UTC: All systems online, monitoring
15:30 UTC: Post-mortem scheduled
```

---

## On-Call Responsibilities

### During Shift

- [ ] Check for any overnight incidents (start of shift)
- [ ] Review logs for anomalies
- [ ] Respond to P1/P2 within SLA
- [ ] Keep incident channel updated (every 15 min if P1)
- [ ] Notify stakeholders (product, ops)
- [ ] Never go offline without handoff

### Handoff

```bash
# End of shift
# In Slack #on-call-handoff:

@oncall-next Hi! Handing off from me.
Status summary:
- P2 incident (Storage lag): Ongoing, team working on it
- Alert flake on API latency: False alarm, disabled
- Backup jobs: All completed normally

No immediate action needed. Dashboard: [link]
Questions? Feel free to ask.

Signed: @current-oncall
```

### Escalation Rules

**If unsure how to respond**:
1. Don't guess — ask
2. Escalate to team lead immediately
3. Better safe than sorry (page if P1/P2)

---

## After-Incident

### Post-Mortem (P1/P2 Only)

**Schedule**: Within 24 hours of incident end

**Participants**: 
- Incident commander
- Engineers involved
- Team lead
- Manager (if needed)

**Template**: See [incident-response.md](incident-response.md)

**Outcomes**:
- Root cause identified
- Action items assigned (with owners + deadlines)
- Process changes documented
- Share learnings broadly

### Follow-Up

**Week 1**:
- [ ] Action items started
- [ ] Customer impact assessed
- [ ] Public post-mortem (if customer-facing)

**Month 1**:
- [ ] Action items completed
- [ ] Monitoring/alerts improved
- [ ] Similar incidents less likely

---

## Checklist: Setting Up On-Call

- [ ] PagerDuty account created
- [ ] Escalation policy defined
- [ ] On-call rotation scheduled
- [ ] Handoff procedure documented
- [ ] Contact info verified (phone, email, Slack)
- [ ] Off-hours escalation defined
- [ ] Budget for on-call compensation
- [ ] Runbooks documented (by component)
- [ ] Team trained on incident response

---

See [README.md](README.md) | [on-call-procedures.md](on-call-procedures.md) | [incident-response.md](incident-response.md)
