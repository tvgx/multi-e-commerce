# 📞 Escalation Contacts & On-Call

**Quick reference** khi bạn cần giúp hoặc có incident.

---

## Support Channels

| Situation | Contact | Urgency | Response Time |
|---|---|---|---|
| **Quick question** | Slack #engineering | Low | 1+ hours |
| **Code review needed** | Tag reviewer in PR | Medium | 1–4 hours |
| **Staging broken** | Slack #ops + on-call | High | 30 min |
| **Production down (P1)** | PagerDuty + Slack #incidents | **CRITICAL** | 5 min |
| **Production degraded (P2)** | Slack #ops + on-call | High | 15 min |
| **Low priority issue (P3)** | GitHub issue + backlog | Low | Next sprint |

---

## Escalation Levels

### Level 1: Team Lead (Development Issues)
- **When**: Stuck on code, design question, feature clarification
- **Contact**: Slack @team-lead or email
- **SLA**: 2–4 hours

### Level 2: Ops Admin (Staging Operations)
- **When**: Staging deploy failed, database migration issue, backup restore test
- **Contact**: Slack #ops, on-call Ops
- **SLA**: 1 hour

### Level 3: Platform Admin (Production Emergency)
- **When**: Production is down, data loss, security incident
- **Contact**: PagerDuty (auto-escalate) + Slack #incidents
- **SLA**: 5–15 minutes
- **Conditions**: Change ticket required, post-mortem within 24h

---

## On-Call Roles (24/7 Coverage)

### SRE On-Call (Prod Support)
- Phone: [Configured in PagerDuty]
- Backup: SRE Team Lead
- Window: UTC (24/7 rotation)
- Capabilities: Platform admin access, can use --force flag

### Ops On-Call (Ops Support)
- Slack: #ops-oncall
- Backup: Ops Lead
- Window: Business hours + escalation window
- Capabilities: Ops admin access

---

## Incident Response

### Incident Type: Production Down (P1)

1. **Alert triggers** → PagerDuty pages SRE on-call
2. **Acknowledge** → SRE joins Slack #incidents
3. **Triage** → Identify root cause (API? DB? K8s? Network?)
4. **Mitigate** → Immediate action to restore service
   - Rollback deployment?
   - Restart pod?
   - Failover to backup?
5. **Restore** → Get service back to healthy state
6. **Post-Mortem** → Within 24 hours
   - RCA (root cause analysis)
   - What broke?
   - Why did we miss it?
   - Improvements to monitor/alerting/testing

### Incident Type: Staging Down (P2)

1. **Alert or manual report** → Slack #ops
2. **Acknowledge** → On-call Ops investigates
3. **Triage & Fix** → As above
4. **Document** → Slack thread or GitHub issue
5. **Review** → No post-mortem required (unless pattern)

---

## Emergency Contact Chain

```
🚨 PRODUCTION EMERGENCY:

  PagerDuty Alert
       ↓
  SRE On-Call (mobile page)
       ↓
  Slack #incidents auto-created
       ↓
  Platform Admin + Ops Lead joined
       ↓
  Decide: Rollback? Failover? Hotfix?
       ↓
  Execute with audit logging
       ↓
  24-hour post-mortem scheduled
```

---

## After Hours / Weekend

**Deployment window**: 09:00–17:00 UTC (Monday–Friday)  
**Outside window**: Emergency only

**To trigger emergency action**:
```bash
admin run --force \
  --reason "P1-ICT-<incident-ticket>" \
  --approver-team "sre-on-call"
```

**What happens**:
1. Auto-escalates to SRE on-call via PagerDuty
2. 6-hour review window
3. If approved: change stands
4. If not approved: auto-rollback
5. Mandatory post-mortem within 24 hours

---

## Team Contacts (Example)

> **Note**: Update with your team's actual contact info

| Role | Name | Slack | Email | Phone |
|---|---|---|---|---|
| Platform Admin | Alice Johnson | @alice | alice@company.com | +1-555-0101 |
| SRE Lead | Bob Smith | @bob-sre | bob@company.com | +1-555-0102 |
| Ops Lead | Carol Lee | @carol-ops | carol@company.com | +1-555-0103 |
| Tech Lead | David Chen | @david-tech | david@company.com | +1-555-0104 |
| DB Admin | Emma Wilson | @emma-dba | emma@company.com | +1-555-0105 |

---

## Handoff Checklist

When incident/on-call rotates:

- [ ] Update PagerDuty escalation policy
- [ ] Slack status: "On-call until [date]"
- [ ] Share runbooks & contact list
- [ ] 30-min overlap call (handoff meeting)
- [ ] Previous on-call available for Q&A first 24h

---

**More details?** → [../escalation/](../escalation/)
