# 📊 Monitoring — Health Checks & Observability

Proactive health monitoring, alerts, and observability setup.

---

## Health Check Architecture

```
Application Health Checks (Liveness/Readiness)
         ↓
Kubernetes Probes (restart unhealthy pods)
         ↓
Prometheus Metrics (CPU, memory, requests)
         ↓
AlertManager (sends alerts to PagerDuty)
         ↓
Grafana Dashboards (visualization)
         ↓
Slack / Email (notifications)
```

---

## Application Health Endpoints

### API Core (`/health`, `/ready`)

```typescript
// GET /health (liveness probe)
// Should be cheap, quick, non-blocking
@Get('/health')
health() {
  return { status: 'ok', timestamp: new Date() };
}

// GET /ready (readiness probe)
// Check dependencies: DB, cache, etc.
@Get('/ready')
async ready() {
  const db = await checkDatabase();
  const cache = await checkRedis();
  
  if (!db || !cache) {
    throw new ServiceUnavailableException('Dependencies not ready');
  }
  
  return { status: 'ready', dependencies: { db, cache } };
}
```

### Kubernetes Configuration

```yaml
# api-core deployment spec
containers:
- name: api
  image: api-core:latest
  
  # Liveness: Restart if pod is hung
  livenessProbe:
    httpGet:
      path: /health
      port: 3000
    initialDelaySeconds: 10
    periodSeconds: 10
    timeoutSeconds: 5
    failureThreshold: 3
  
  # Readiness: Don't route traffic if not ready
  readinessProbe:
    httpGet:
      path: /ready
      port: 3000
    initialDelaySeconds: 5
    periodSeconds: 5
    timeoutSeconds: 3
    failureThreshold: 3
```

---

## CLI Tool Health Command

```bash
# Comprehensive health check
python main.py health check --full

# Output:
# ✅ API connectivity: OK (350ms)
# ✅ PostgreSQL: OK (12ms, 45 connections)
# ✅ MongoDB: OK (18ms, 8 connections)
# ✅ Redis: OK (3ms)
# ✅ S3/Blob storage: OK (125ms)
# ✅ Disk space: OK (68% used)
# ✅ Database integrity: OK (all tables present)
# ⚠️  Slow queries detected: 2 queries > 1s
# 
# Overall: HEALTHY (some warnings)

# Quick check (faster)
python main.py health check

# Output:
# Status: HEALTHY
```

---

## Prometheus Metrics

### Key Metrics to Monitor

```
http_requests_total{method="GET", status="200"}           → Request count
http_request_duration_seconds{quantile="0.95"}             → Response latency
http_requests_failed_total{status="500"}                   → Error count
container_memory_usage_bytes                               → Memory usage
container_cpu_usage_seconds_total                          → CPU usage
pg_stat_user_tables_live_tuples{table="products"}         → Row counts
mongodb_connections_active                                 → DB connections
redis_connected_clients                                    → Cache clients
```

### Prometheus Scrape Config

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
- job_name: 'api-core'
  static_configs:
  - targets: ['api-core:3000']
  metrics_path: '/metrics'

- job_name: 'kubernetes-pods'
  kubernetes_sd_configs:
  - role: pod
    namespaces:
      names:
      - ecommerce
  relabel_configs:
  - source_labels: [__meta_kubernetes_pod_container_port_name]
    action: keep
    regex: metrics
```

---

## Alerting Rules

### AlertManager Rule Examples

```yaml
# alerting-rules.yaml
groups:
- name: api-core
  interval: 30s
  rules:
  
  # Critical: Pod crashing
  - alert: PodCrashLoopBackOff
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Pod {{ $labels.pod }} crashing"
      action: "Check logs: kubectl logs {{ $labels.pod }}"
  
  # Critical: High error rate
  - alert: HighErrorRate
    expr: rate(http_requests_failed_total[5m]) > 0.01
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Error rate > 1% on {{ $labels.instance }}"
      action: "Check API logs for error patterns"
  
  # High: High latency
  - alert: HighLatency
    expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
    for: 10m
    labels:
      severity: high
    annotations:
      summary: "P95 latency > 1 second"
      action: "Check database performance, CPU usage"
  
  # Medium: High memory usage
  - alert: HighMemory
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
    for: 10m
    labels:
      severity: medium
    annotations:
      summary: "Memory > 85% on {{ $labels.pod }}"
  
  # Low: Disk space
  - alert: DiskSpaceLow
    expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
    for: 30m
    labels:
      severity: low
    annotations:
      summary: "Disk < 10% free on {{ $labels.device }}"
```

### Alert Routing (AlertManager)

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: slack-critical
  group_by: [severity, alertname]
  routes:
  
  # Critical → PagerDuty (page on-call)
  - match:
      severity: critical
    receiver: pagerduty
    continue: true
  
  # High → Slack + email
  - match:
      severity: high
    receiver: slack-high
  
  # Medium/Low → Slack only
  - match_re:
      severity: medium|low
    receiver: slack-medium

receivers:
- name: pagerduty
  pagerduty_configs:
  - service_key: '${PAGERDUTY_SERVICE_KEY}'

- name: slack-critical
  slack_configs:
  - api_url: '${SLACK_WEBHOOK_CRITICAL}'
    channel: '#alerts-critical'
    title: '🔴 CRITICAL: {{ .GroupLabels.alertname }}'

- name: slack-high
  slack_configs:
  - api_url: '${SLACK_WEBHOOK_HIGH}'
    channel: '#alerts-high'
    title: '🟠 HIGH: {{ .GroupLabels.alertname }}'

- name: slack-medium
  slack_configs:
  - api_url: '${SLACK_WEBHOOK_GENERAL}'
    channel: '#alerts'
    title: '🟡 {{ .GroupLabels.alertname }}'
```

---

## Grafana Dashboards

### Sample Dashboard: API Core Overview

```json
{
  "dashboard": {
    "title": "API Core Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_failed_total[5m])"
          }
        ]
      },
      {
        "title": "P95 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "Pod Memory",
        "targets": [
          {
            "expr": "container_memory_usage_bytes"
          }
        ]
      }
    ]
  }
}
```

---

## Monitoring Checklist

Daily:
- [ ] Review error logs (< 1% threshold)
- [ ] Check latency metrics (p95 < 500ms)
- [ ] Verify pod health (all running, no restarts)
- [ ] Check database performance (connections healthy, no slow queries)

Weekly:
- [ ] Review trends (capacity planning)
- [ ] Check alert accuracy (false positives?)
- [ ] Update dashboards
- [ ] Review on-call rotations

Monthly:
- [ ] Capacity planning (growth trajectory)
- [ ] Performance review (improvements/regressions)
- [ ] Alert tuning (adjust thresholds if needed)

---

See [README.md](README.md) | [alerts.md](alerts.md) | [observability.md](observability.md) | [audit-logging.md](audit-logging.md)
