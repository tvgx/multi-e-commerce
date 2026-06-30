# AGENTS.md - E-commerce CLI Tool Agent Rules & Permissions

**Version 1.0** | **Last Updated: April 6, 2026**

This document defines role-based permissions, agent behaviors, and automation rules for the E-commerce CLI tool across different user types and operational contexts.

---

## User Roles & Permissions Matrix

### 1. **Developer** (Development Environment)

**API Key Level**: `dev-*` (development tier)

**Allowed Commands**:
```
SHOP:
  ✓ shop list (personal shops only)
  ✓ shop create --dry-run
  ✓ shop eject (set up local env)
  ✗ shop delete (not allowed)
  
TEMPLATES:
  ✓ template list
  ✓ template apply --dry-run
  ✗ template apply (requires approval)

BACKUP:
  ✓ backup create (manual only)
  ✓ backup list
  ✓ backup restore --dry-run
  ✗ backup restore (requires approval)

BATCH:
  ✓ batch create --dry-run
  ✗ batch create (manual approval)

HEALTH:
  ✓ health check
  ✓ health check --full

SYNC:
  ✓ sync config --dry-run
  ✗ sync config (not allowed - use dev env only)

AUDIT:
  ✓ audit view (personal/shop specific)
  ✓ audit summary (shop specific)
```

**Restrictions**:
- Cannot delete shops or backups
- Cannot perform production syncs
- All batch operations require `--dry-run` first
- Cannot bypass confirmation prompts
- Limited to dev/acceptance environments

**Environment Variables**:
```bash
CLI_ENV=development
API_KEY=dev-<random>
FEATURE_FLAGS=dry_run_only
```

---

### 2. **Shop Administrator** (Shop Owner/Manager)

**API Key Level**: `shop-<shop-id>` (tenant-scoped)

**Allowed Commands**:
```
SHOP:
  ✓ shop get (own shop)
  ✓ shop update (own shop)
  ✓ shop list (own shop only)
  ✗ shop create (requires admin)
  ✗ shop delete (requires admin)

TEMPLATE:
  ✓ template list
  ✓ template apply (own shop)
  ✓ template apply --dry-run

BACKUP:
  ✓ backup create (own shop)
  ✓ backup list (own shop)
  ✓ backup restore --dry-run (own shop)
  ✓ backup restore (own shop, with confirmation)
  ✓ backup rollback (own shop, with confirmation)

HEALTH:
  ✓ health check (own shop)
  ✓ health check --full (own shop)

WIZARD:
  ✓ wizard start --shop-id <own-shop>

AUDIT:
  ✓ audit view --shop <own-shop>
  ✓ audit summary --shop <own-shop>

SYNC:
  ✗ sync config (not allowed)
```

**Restrictions**:
- Scoped to single shop (multi-tenancy enforcement)
- Cannot create new shops
- Cannot perform environment syncs
- Cannot approve batch operations
- Audit logs visible only for own shop

---

### 3. **Operations Administrator** (Ops Team)

**API Key Level**: `admin-ops` (operations tier)

**Allowed Commands**:
```
SHOP:
  ✓ shop create
  ✓ shop list (all shops)
  ✓ shop get (all shops)
  ✓ shop update (all shops)
  ✗ shop delete (requires platform admin)

BATCH:
  ✓ batch create (all operations)
  ✓ batch create --parallel 20 (adjust workers)
  ✓ batch create --continue-on-error

BACKUP:
  ✓ backup create (all shops)
  ✓ backup list (all shops)
  ✓ backup restore (all shops)
  ✓ backup rollback (all shops)
  ✓ backup delete (old backups > 30 days)

HEALTH:
  ✓ health check (all shops)
  ✓ health check --full (all shops)
  ✓ health check --auto-fix (all shops)

WIZARD:
  ✓ wizard start (create new shops)

SYNC:
  ✓ sync config (staging ↔ acceptance)
  ✗ sync config (to production - requires approval)

AUDIT:
  ✓ audit view (all events)
  ✓ audit view --json (export)
  ✓ audit summary
```

**Restrictions**:
- Cannot delete shops (platform admin only)
- Cannot skip environment hierarchy (dev → prod always)
- Cannot perform unsafe sync operations without confirmation
- All operations logged and audited

**Environment Variables**:
```bash
CLI_ENV=staging
API_KEY=admin-ops-<random>
AUDIT_RETENTION_DAYS=90
```

---

### 4. **Platform Administrator** (SRE/DevOps)

**API Key Level**: `admin-platform` (full access)

**Allowed Commands**:
```
ALL COMMANDS
  ✓ All operations without restrictions
  ✓ All environments (dev, acceptance, staging, prod)
  ✓ Bypass confirmations with --force
  ✓ Direct API calls
  ✓ Configuration management
  ✓ All audit operations

SPECIAL:
  ✓ shop delete (entire lifecycle)
  ✓ backup delete (any backup)
  ✓ sync config (any direction with approval)
  ✓ health check --auto-fix (all shops)
  ✓ audit view --json (compliance exports)
  ✓ config --set-env (any environment)
```

**Restrictions**:
- Only in emergency situations
- All actions recorded with audit trail
- Changes require change management approval (staged)
- Limited to specific individuals/teams

---

### 5. **Kubernetes Service Account** (Automated Jobs)

**API Key Level**: `sa-kubernetes` (service account)

**Allowed Commands**:
```
BACKUP:
  ✓ backup create (all shops, daily CronJob)
  ✓ backup delete (backups > 30 days)

HEALTH:
  ✓ health check (all shops, weekly CronJob)
  ✓ health check --full (weekly)
  ✓ health check --auto-fix (on failure)

AUDIT:
  ✓ audit view --json (export weekly)
  ✓ audit summary

BATCH:
  ✓ batch create (from K8s Job ConfigMap)
  ✓ batch create --continue-on-error
  ✓ batch create --parallel 10 (K8s managed)

SYNC:
  ✗ sync config (disabled for automation)
```

**Restrictions**:
- Read-only for most operations (except backup cleanup)
- Cannot create or delete shops
- Cannot perform manual syncs
- Runs with minimum required permissions
- API calls logged separately (audit trail)

**Environment**:
```bash
CLI_ENV=production
PYTHONUNBUFFERED=1
LOG_LEVEL=info
KUBERNETES_POD_NAME=<from K8s metadata>
```

---

### 6. **GitHub Actions CI/CD** (Automated Deployment)

**API Key Level**: `gh-actions` (CI/CD tier)

**Allowed Commands**:
```
BUILD & TEST:
  ✓ python main.py --help (validation)
  ✓ pytest (unit tests)
  ✓ flake8 (linting)

DEPLOY:
  ✓ kubectl apply (K8s manifests)
  ✓ kubectl rollout (verify deployment)

MONITOR:
  ✓ health checks (6-hourly)
  ✓ backup verification
  ✓ audit log collection

MANUAL OVERRIDE:
  ✗ shop create (not in CI/CD)
  ✗ shop delete (not in CI/CD)
  ✗ sync config (not in CI/CD)
```

**Restrictions**:
- CLI commands restricted to automation workflows
- Cannot execute against production API directly
- Must use K8s service account credentials
- All actions tied to GitHub PR/commit
- Requires branch protection + approval

---

## API Key Management

### Key Format

```
<role>-<environment>-<random>

Examples:
- dev-development-abc123
- shop-staging-shop456-def789
- admin-ops-staging-ghi012
- admin-platform-production-jkl345
- sa-kubernetes-production-mno678
- gh-actions-cicd-pqr901
```

### Key Rotation Schedule

| Level | Rotation | Risk |
|-------|----------|------|
| Development | Monthly | Low |
| Shop Admin | Quarterly | Medium |
| Ops Admin | Quarterly | High |
| Platform Admin | Bi-weekly | Critical |
| Service Accounts | Monthly | High |
| CI/CD | Monthly | High |

### Key Storage

```
Development:  ~/.ecommerce-cli/session.json
Staging:      K8s Secret (versioned)
Production:   Azure Key Vault (encrypted)
CI/CD:        GitHub Secrets (encrypted)
```

---

## Command Approval Workflow

### High-Risk Operations (Require Approval)

```
Priority: CRITICAL (stop and alert)
├─ shop delete
├─ backup restore (production)
├─ sync config (→ production)
└─ health check --auto-fix (production)

Priority: HIGH (confirm + log)
├─ batch create (> 10 shops)
├─ backup delete (manual override)
└─ sync config (→ staging)

Priority: MEDIUM (dry-run preview)
├─ shop update (production)
├─ template apply
└─ sync config (dry-run)

Priority: LOW (execute)
├─ shop get
├─ backup list
├─ audit view
└─ health check
```

### Approval Process

```
User runs high-risk command
↓
CLI displays:
  - Operation summary
  - Affected resources
  - Estimated impact
  - Backup status (if applicable)
↓
User confirms: "Are you sure? (yes/no)"
↓
If yes:
  - Auto-backup created (if needed)
  - Operation executed
  - Audit event logged
  - Notification sent
↓
If no:
  - Operation cancelled
  - No changes made
  - Logged as "cancelled_by_user"
```

---

## Audit Logging Rules

### Events to Log (All Roles)

```
SHOP_CREATED
  - user_id, shop_id, name, domain
  - timestamp, status (success/failed)
  - create_method (wizard/cli/batch/api)

SHOP_UPDATED
  - user_id, shop_id, changes
  - timestamp, status

SHOP_DELETED
  - user_id, shop_id, reason
  - backup_created_before_delete (bool)
  - timestamp

BACKUP_CREATED
  - user_id, shop_id, backup_id
  - size_mb, components (pg/mongo)
  - timestamp, status

BACKUP_RESTORED
  - user_id, shop_id, backup_id
  - timestamp, status, data_loss_warning

HEALTH_CHECK
  - user_id, shops_checked, health_score_avg
  - issues_found, auto_fixes_applied
  - timestamp

SYNC_CONFIG
  - user_id, shop_id, from_env → to_env
  - fields_changed, backup_created
  - timestamp, status, approval_chain

BATCH_OPERATION
  - user_id, operation_type, shop_count
  - success_count, failed_count
  - timestamp, parallel_workers

AUTH_LOGIN
  - user_id, role, environment
  - timestamp, token_expiry

AUTH_FAILED
  - user_id (if known), reason
  - timestamp, ip_address

PERMISSION_DENIED
  - user_id, attempted_command
  - required_role, actual_role
  - timestamp
```

### Compliance & Export

```
Retention Policy:
  Development:  7 days
  Staging:      30 days
  Production:   90 days (+ archive)

Export Format:
  - Line-delimited JSON (NDJSON)
  - Immutable (append-only)
  - Cryptographic signature

Encryption:
  At rest:  AES-256
  In transit: TLS 1.3
  Key rotation: Monthly
```

---

## Environment-Specific Rules

### Development

```
- All commands allowed (with dry-run enforcement)
- No approval required
- 24-hour data retention
- Local backups only
- Higher rate limits
```

### Staging

```
- Production-like config
- Batch operations: 5 shops limit
- Approval chain: 1 person minimum
- 30-day data retention
- Replica of production schema
```

### Production

```
- Strictest enforcement
- Critical operations: 2-person approval
- Batch operations: 10 shops limit
- 90-day data retention + archive
- Audit trail immutable + signed
- Change windows: 9 AM - 5 PM UTC only
```

---

## Agent Behavior Rules

### Copilot Interaction

**When suggesting shop operations**:
```
1. Always mention --dry-run for risky operations
2. Show confirmation prompt in output
3. Suggest backup before deletion
4. Alert user to audit trail consequences
```

**When suggesting sync operations**:
```
1. Verify environment hierarchy (dev → prod only)
2. Suggest backup before sync
3. Show diff preview
4. Warn about rollback limitations
```

**When suggesting batch operations**:
```
1. Suggest CSV template format
2. Recommend --dry-run first
3. Show parallel worker count
4. Suggest --continue-on-error for robustness
```

### Command Suggestions by Context

**User role: Developer**
```
✓ Suggest: shop list, create --dry-run, health check
✗ Avoid: shop delete, backup restore, sync config
→ Always include --dry-run flag
```

**User role: Operations Admin**
```
✓ Suggest: batch create, health check --auto-fix, sync config
✓ Include: approval workflow, backup strategy
✗ Avoid: platform-level operations (shop delete)
```

---

## Service Account Design

### Kubernetes Service Account

```
Name: ecommerce-cli
Namespace: ecommerce-cli

RBAC Permissions:
  - batch.jobs: get, list, watch
  - core.pods: get, list, logs
  - core.configmaps: get, list
  - core.secrets: get, list
```

### CI/CD Service Account

```
Name: github-actions
Scope: Deployments only

Permissions:
  - kubectl apply (manifests)
  - kubectl rollout (verify)
  - Docker push (images)
  - Azure Key Vault read
```

---

## Escalation & Emergency Procedures

### Escalation Path

```
Level 1 (Developer):
  - Spot issues in dev environment
  - Contact: Team Lead

Level 2 (Operating Admin):
  - Investigate in staging
  - Can escalate to platform admin
  - Contact: SRE Team

Level 3 (Platform Admin):
  - Fix production issues
  - Requires change ticket
  - Contact: On-call SRE

Emergency Bypass (24/7 Escalation):
  - Platform admin can use --force flag
  - Requires: incident ticket + post-mortem
  - Must: disable automated cleanup (48h delay)
```

### Emergency Override

```bash
# Only for critical incidents
admin run --force --reason "ICT-12345" --approver-team "sre-on-call"

# Results in:
# 1. Immediate audit log entry
# 2. Auto-escalation to SRE team
# 3. 6-hour review window
# 4. Auto-rollback if not approved
```

---

## Future Enhancements

- [ ] Multi-factor authentication (MFA) for platform admin
- [ ] OAuth2 integration with corporate SSO
- [ ] Attribute-based access control (ABAC)
- [ ] Real-time audit streaming to SIEM
- [ ] Automated compliance reporting (GDPR, SOC2)
- [ ] Rate limiting per role
- [ ] IP whitelisting for production
- [ ] Hardware security key support

---

**Last Reviewed**: April 6, 2026  
**Next Review**: May 6, 2026  
**Change Control**: Required for updates
