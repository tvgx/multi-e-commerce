# 🤖 Agents — Automation Rules

Rules for CLI Tool automation, Kubernetes jobs, and scheduled tasks.

---

## Automation Architecture

```
GitHub Actions (CI/CD)
    ↓
Kubernetes CronJobs (Scheduled)
    ↓
Kubernetes Jobs (One-off)
    ↓ (triggers)
CLI Tool (python main.py)
```

---

## CLI Tool Automation

### Allowed Commands for Automation

**Read-only operations** ✅:
```bash
python main.py shop list
python main.py health check
python main.py audit view
python main.py backup list
```

**Write operations** (with restrictions) ⚠️:
```bash
python main.py backup create      # Yes (daily)
python main.py health check --auto-fix  # Yes (weekly)
python main.py batch create --csv  # No (requires manual approval)
```

**Forbidden** ❌:
```bash
python main.py shop delete        # Never automated
python main.py backup restore     # Never automated
python main.py sync config        # Never automated
```

---

## Kubernetes CronJobs

Automated tasks running on schedule:

### Daily: Backup Creation

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"  # 2 AM UTC daily
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: ecommerce-cli
          containers:
          - name: backup
            image: cli-tool:latest
            command:
            - python
            - main.py
            - backup
            - create
            - --all-shops
            - --compression gzip
            env:
            - name: API_KEY
              valueFrom:
                secretKeyRef:
                  name: cli-secrets
                  key: api-key-sa
            - name: LOG_LEVEL
              value: "info"
          restartPolicy: OnFailure
```

**Verification**:
```bash
# Check last run
kubectl get cronjob daily-backup -n ecommerce -o wide
kubectl logs -n ecommerce \
  $(kubectl get pod -n ecommerce -l job-name=daily-backup-xxx -o jsonpath='{.items[0].metadata.name}')
```

### Weekly: Health Check + Auto-Fix

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: weekly-health-check
spec:
  schedule: "0 3 * * 0"  # 3 AM UTC every Sunday
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: ecommerce-cli
          containers:
          - name: health
            image: cli-tool:latest
            command:
            - python
            - main.py
            - health
            - check
            - --full
            - --auto-fix
            env:
            - name: API_KEY
              valueFrom:
                secretKeyRef:
                  name: cli-secrets
                  key: api-key-sa
          restartPolicy: OnFailure
```

**Auto-fix capabilities**:
- Reindex databases
- Cleanup orphaned records
- Refresh cache
- Reconcile inventory counts

**Notification on failure**:
```bash
# Add to CronJob spec
- name: notify
  image: curlimages/curl
  command:
  - sh
  - -c
  - |
    if [ $? -ne 0 ]; then
      curl -X POST https://slack.com/api/chat.postMessage \
        -H 'Authorization: Bearer $SLACK_TOKEN' \
        -d 'channel=C0123456789&text=Weekly health check failed'
    fi
```

---

## GitHub Actions (CI/CD Automation)

### Test on Every Push

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run lints
      run: npm run lint
    
    - name: Run tests
      run: npm run test:cov
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Build & Push Docker Images

```yaml
name: Build Images
on:
  push:
    branches: [main, troll]
    paths:
    - 'apps/api-core/**'
    - '.github/workflows/build-api.yml'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: docker/setup-buildx-action@v2
    
    - name: Build image
      uses: docker/build-push-action@v4
      with:
        context: ./apps/api-core
        push: ${{ github.ref == 'refs/heads/main' }}  # Only on main
        tags: |
          ghcr.io/tvgx/api-core:${{ github.sha }}
          ghcr.io/tvgx/api-core:latest
```

### Deploy to Staging (Manual)

```yaml
name: Deploy to Staging
on:
  workflow_dispatch:  # Manual trigger
    inputs:
      environment:
        type: choice
        options:
        - staging
        - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Deploy to ${{ inputs.environment }}
      run: |
        ./scripts/deploy.sh ${{ inputs.environment }}
```

---

## Approval Workflow for Automated Operations

### Backup Creation (Automated ✅)

```
Schedule: Daily 2 AM
Action: python main.py backup create --all-shops
Approval: None (automated)
Monitoring: Email on failure
Rollback: Manual (if restore needed)
```

### Health Check Auto-Fix (Automated ✅)

```
Schedule: Weekly Sunday 3 AM
Action: python main.py health check --auto-fix
Approval: None (automated, but monitored)
Constraints: Only apply safe fixes (no deletion)
Monitoring: Slack notification if issues found
Changes logged: Audit trail in DB
```

### Batch Operations (Manual Only ❌)

```
Request: Ops admin opens PR with batch CSV
Action: python main.py batch create --csv shops.csv
Approval: 1-person approval (code review)
Dry-run: Optional (recommended)
Rollback: Manual restore from backup
```

---

## Error Handling & Retries

### CronJob Failure Handling

```yaml
spec:
  jobTemplate:
    spec:
      backoffLimit: 3  # Retry 3 times
      activeDeadlineSeconds: 3600  # Timeout after 1 hour
```

### Exponential Backoff

```python
# cli-tool/lib/retry.py
import time

def retry_with_backoff(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            wait_time = 2 ** attempt  # 1s, 2s, 4s
            if attempt == max_retries - 1:
                raise
            print(f"Retry in {wait_time}s... ({attempt + 1}/{max_retries})")
            time.sleep(wait_time)
```

---

## Monitoring & Alerting

### Metrics to Track

```
- Backup success rate (target: 100%)
- Average backup duration (target: < 30 min)
- Health check auto-fix success rate (target: 100%)
- Database reindex frequency & duration
- CLI tool API response times (target: < 1s avg)
```

### Alerting Rules

```yaml
# Prometheus/Alertmanager config
group: cli-automation
rules:
- alert: DailyBackupFailed
  expr: increase(cli_backup_failed_total[1d]) > 0
  annotations:
    summary: "Daily backup failed"
    action: "Check backup logs, manual restore may be needed"

- alert: HealthCheckSlowdown
  expr: histogram_quantile(0.99, cli_health_check_duration_seconds) > 300
  annotations:
    summary: "Health check taking > 5 min"
```

---

## Testing Automation

### Test in Dev First

```bash
# Before adding CronJob to prod
cd apps/cli-tool

# Test backup command
python main.py backup create --shop-id test-shop --dry-run

# Test with mock API
pytest tests/test_automation.py -v --mock-api

# Test error handling
python main.py backup create --shop-id nonexistent
```

### Test Schedule

```bash
# Manually trigger CronJob (Kubernetes)
kubectl create job --from=cronjob/daily-backup \
  daily-backup-manual-test -n ecommerce

# Check output
kubectl logs -f job/daily-backup-manual-test -n ecommerce
```

---

See [../README.md](../README.md) for overview
