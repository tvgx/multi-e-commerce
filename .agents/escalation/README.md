# 🚀 Escalation & On-Call — README

---

## Overview

**Support Levels**: P1 (down) / P2 (degraded) / P3 (low)  
**On-Call**: 24/7 SRE rotation, on-call Ops during business hours  
**Post-Mortem**: RCA template, incident review within 24 hours  

---

## Files

1. **support-levels.md** — P1/P2/P3 definitions, owner, SLA
2. **on-call-procedures.md** — Incident response, out-of-hours workflow
3. **post-mortem-template.md** — RCA template, followup items

---

## Quick Response Matrix

| Level | Severity | SLA | Owner | Action |
|-------|----------|----|-------|--------|
| P1 | Down | 5 min | SRE on-call | Page SRE, immediate triage & fix |
| P2 | Degraded | 15 min | Ops on-call | Investigate root cause, fix in 4h |
| P3 | Low | Sprint | Team | Backlog item, fix when time permits |

---

## Incident Response

1. **Alert triggers** → PagerDuty pages SRE
2. **SRE joins** → Slack #incidents
3. **Triage** → Identify root cause
4. **Mitigate** → Rollback/restart/failover
5. **Postmortem** → Within 24h (P1 only)

---

**See detailed files→** [support-levels.md](support-levels.md), [on-call-procedures.md](on-call-procedures.md), [post-mortem-template.md](post-mortem-template.md)
