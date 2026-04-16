# 🤖 Agents — CI/CD Rules & GitHub Actions

GitHub Actions workflows configuration, secrets, deployment gates.

---

## Workflow Structure

All workflows in `.github/workflows/*.yml`:

```
.github/workflows/
├── 01-tests.yml           # Run on push + PR (all branches)
├── 02-lint.yml            # ESLint, Flake8, code style
├── 03-build.yml           # Docker build on main + tags
├── 04-deploy-staging.yml  # Manual deploy to staging
├── 05-deploy-prod.yml     # Manual deploy to production
├── 06-security.yml        # Dependency scan, secret scan
└── 07-release.yml         # Tag releases, create GitHub releases
```

---

## Workflow Triggers

### On Every Push (All Branches)

```yaml
# Tests, linting (fails PR if not passing)
on:
  push:
    branches: ['**']  # All branches
  pull_request:
    branches: [main, troll]
```

**Status checks**:
- ✅ Tests must pass
- ✅ Linting must pass
- ✅ No new vulnerabilities (Dependabot)
- ✅ Code coverage 70%+

**If PR fails**: Can't merge until fixed

### On Main Branch Only

```yaml
# Build & push Docker images
on:
  push:
    branches: [main]
    paths:
    - 'apps/api-core/**'
    - '.github/workflows/03-build.yml'
```

### Manual Trigger (Workflow Dispatch)

```yaml
# Deploy workflow
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        type: choice
        options:
        - staging
        - production
```

---

## Required Secrets

Store in GitHub → Settings → Secrets and variables → Actions

| Secret | Purpose | Scope |
|--------|---------|-------|
| `DOCKER_USERNAME` | Docker Hub login | All workflows |
| `DOCKER_PASSWORD` | Docker Hub token | All workflows |
| `AZURE_CREDENTIALS` | Azure CLI login (JSON) | Deploy workflows |
| `API_STAGING_KEY` | Staging API key | Deploy & test workflows |
| `API_PROD_KEY` | Production API key | Deploy & release (restricted) |
| `SLACK_WEBHOOK` | Slack notifications | All workflows |

**Example secret value format**:

```json
{
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

---

## Key Workflows

### Tests Workflow

```yaml
name: Tests
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, troll]

jobs:
  test-all:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [admin, api-core, cli-tool, storefront]
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd apps/${{ matrix.app }}
        npm ci
    
    - name: Run tests
      run: |
        cd apps/${{ matrix.app }}
        npm run test:cov
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./apps/${{ matrix.app }}/coverage/lcov.info
```

**Status badge in README**:
```markdown
![Tests](https://github.com/tvgx/multi-e-commerce/workflows/Tests/badge.svg)
```

### Security Workflow

```yaml
name: Security
on:
  push:
    branches: [main, troll]
  schedule:
  - cron: '0 2 * * 0'  # Weekly

jobs:
  dependabot:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run npm audit
      run: npm audit --all
      continue-on-error: true  # Don't block PR
    
    - name: Scan for secrets
      uses: gitleaks/gitleaks-action@v2
```

### Build Workflow

```yaml
name: Build
on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build & push API image
      uses: docker/build-push-action@v4
      with:
        context: ./apps/api-core
        push: true
        tags: |
          tvgx/api-core:${{ github.sha }}
          tvgx/api-core:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

### Deploy Workflow (Manual)

```yaml
name: Deploy
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}  # Approval gate
    steps:
    - uses: actions/checkout@v3
    - uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Deploy to ${{ inputs.environment }}
      run: |
        export ENVIRONMENT=${{ inputs.environment }}
        ./scripts/deploy.sh
    
    - name: Notify Slack
      uses: slackapi/slack-github-action@v1
      with:
        webhook-url: ${{ secrets.SLACK_WEBHOOK }}
        payload: |
          {
            "text": "Deployed to ${{ inputs.environment }} by ${{ github.actor }}"
          }
```

---

## Branch Protection Rules

**Enforce on main branch** (Settings → Branches → main):

```
Require a pull request before merging
├─ Require 1 approval
├─ Dismiss stale PR approvals
├─ Require status checks to pass:
│  ├─ Tests (all jobs)
│  ├─ Linting
│  ├─ Security scan
│  └─ Code coverage 70%+
├─ Require branches to be up to date
└─ Restrict who can push
   └─ Only admins
```

---

## Advanced Patterns

### Matrix Strategy (Parallel Testing)

```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, macos-latest]
  fail-fast: false  # Continue if one fails
```

### Conditional Steps

```yaml
- name: Deploy only if main branch
  if: github.ref == 'refs/heads/main'
  run: ./scripts/deploy.sh

- name: Show PR number
  if: github.event_name == 'pull_request'
  run: echo "PR #${{ github.event.number }}"
```

### Reusable Workflows

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test
on:
  workflow_call:
    inputs:
      app-name:
        required: true
        type: string

# .github/workflows/tests.yml
jobs:
  test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      app-name: api-core
```

### Environment-Specific Variables

```yaml
env:
  REGISTRY: ghcr.io

jobs:
  deploy:
    environment: ${{ inputs.environment }}
    env:
      DEPLOY_KEY: ${{ secrets[format('{0}_KEY', inputs.environment)] }}
```

---

## Monitoring & Debugging

### Workflow Runs

```
GitHub → Actions tab
├─ Select workflow
├─ View run history
├─ Click run → View logs
└─ Debug step by step
```

### Enable Debug Logging

```bash
# Add to workflow
env:
  RUNNER_DEBUG: 1  # Verbose runner logs
  ACTIONS_STEP_DEBUG: true  # Verbose action logs
```

### Local Workflow Testing

```bash
# Install act (local runner)
brew install act

# Run workflow locally
act -j test-all -s DOCKER_USERNAME=$DOCKER_USER -s DOCKER_PASSWORD=$DOCKER_PASS

# Debug mode
act -j test-all -v
```

---

## Disaster Recovery

### Disable Workflow Temporarily

```
GitHub → Actions → Workflow name → ...  → Disable workflow
```

### Rollback Failed Deployment

```bash
# 1. Check last successful commit
git log --oneline | head -5

# 2. Revert to stable version
git revert abc123def456

# 3. Push (triggers deployment)
git push origin main

# 4. Monitor deployment status
# GitHub Actions → Deploy workflow → Monitor
```

---

See [README.md](README.md) for overview | [automation-rules.md](automation-rules.md)
