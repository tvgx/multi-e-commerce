# 📊 Monitoring & Observability — README

---

## Overview

**Health Checks**: Weekly CronJob (Monday 06:00 UTC)  
**Alerts**: Prometheus + Grafana (latency, errors, pod restarts, disk usage)  
**Audit Logging**: Immutable append-only logs, 90-day retention  
**Observability**: Logging stack (ELK or similar), tracing (optional)  

---

## Files

1. **health-checks.md** — Weekly CronJob, auto-fix rules, thresholds
2. **alerts.md** — Prometheus rules, alert channels (Slack, PagerDuty)
3. **audit-logging.md** — Events logged, retention, export for compliance
4. **observability.md** — Logging/tracing setup

---

## Key Metrics

```
API Response Time
  Threshold: p95 < 2 sec
  Alert: > 2 sec

Error Rate  
  Threshold: < 1%
  Alert: > 1%

Pod Restarts
  Threshold: 0 restarts/hour
  Alert: > 0

Disk Usage
  Threshold: < 80%
  Alert: > 85%
  
Backup Job Status
  Threshold: succeeds daily
  Alert: failed or delayed > 2 hours
```

---

## Health Check Command

```bash
# Weekly automated
health check --full

# Manual check
health check --full --shop <id>

# Auto-repair (ops only, prod)
health check --auto-fix --full --dry-run
health check --auto-fix --full  # execute
```

---

**See detailed files→** [health-checks.md](health-checks.md), [alerts.md](alerts.md), [audit-logging.md](audit-logging.md), [observability.md](observability.md)
