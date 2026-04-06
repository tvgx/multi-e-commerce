# E-commerce CLI - User Documentation

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/tvgx/multi-e-commerce.git
cd multi-e-commerce

# Install dependencies
pip install -r apps/cli-tool/requirements.txt

# Verify installation
python apps/cli-tool/main.py --version
```

### First-Time Setup

```bash
# Configure API connection (choose one)

# Option 1: Interactive setup
python main.py config setup

# Option 2: Environment variables
export CLI_ENV=dev
export API_KEY=your-api-key
export API_URL=http://localhost:3000/api

# Option 3: Config file
cat > ~/.ecommerce-cli/config.json << EOF
{
  "env": "dev",
  "api_url": "http://localhost:3000/api",
  "api_key": "your-api-key"
}
EOF

# Verify configuration
python main.py config --show
```

---

## Common Scenarios

### Scenario 1: Create a New Shop

**Goal:** Launch a new e-commerce store with your company's configuration.

```bash
# Step 1: Preview the creation
python main.py shop create \
  --name "My Fashion Store" \
  --domain myfashionstore.com \
  --owner-email owner@company.com \
  --template fashion \
  --dry-run

# Step 2: If preview looks good, create it
python main.py shop create \
  --name "My Fashion Store" \
  --domain myfashionstore.com \
  --owner-email owner@company.com \
  --template fashion

# Step 3: Verify it was created
python main.py shop get <shop-id>

# Output includes:
# - Shop ID (use for all future operations)
# - Domain configuration
# - Owner contact
# - Creation timestamp
# - Default settings applied
```

**Troubleshooting:**
- "ValidationError: Invalid domain" → Check domain format (e.g., example.com)
- "AuthenticationError" → Check API_KEY is correct (`config --show`)

---

### Scenario 2: Bulk Create 100 Shops

**Goal:** Onboard 100 new shops programmatically.

```bash
# Step 1: Prepare CSV file
cat > shops.csv << EOF
name,domain,owner_email,template
Shop1,shop1.local,owner1@company.com,fashion
Shop2,shop2.local,owner2@company.com,electronics
Shop3,shop3.local,owner3@company.com,health
...
EOF

# Step 2: Preview the batch
python main.py batch create shops.csv --dry-run

# Output shows:
# ✓ Shop1: Valid
# ✓ Shop2: Valid
# ⚠ Shop4: Duplicate domain (will be skipped)
# Summary: 99 valid, 1 invalid

# Step 3: Execute with parallelism
python main.py batch create shops.csv \
  --parallel 20 \
  --continue-on-error \
  --json > results.json

# Step 4: Check results
python main.py audit view --action batch

# Output:
# ✓ 99 shops created in 5 minutes
# ⚠ 1 failed (duplicate domain)
# Audit ID: BATCH_CREATE_202604060120
```

**Performance Tips:**
- Start with `--parallel 5` for first test
- Increase to `--parallel 20` for production
- Use `--continue-on-error` to skip failures

---

### Scenario 3: Backup Before Major Changes

**Goal:** Protect shop data before making risky changes.

```bash
# Step 1: List current backups
python main.py backup list <shop-id>

# Output:
# Timestamp            | Size    | Status
# 20260406_090000      | 125 MB  | Ready
# 20260405_090000      | 128 MB  | Ready
# 20260404_090000      | 127 MB  | Ready

# Step 2: Create backup before change
python main.py backup create <shop-id>

# Output:
# Created backup: 20260406_120030
# Size: 150 MB
# Checksum: SHA256:abc123...
# Status: Ready for restore

# Step 3: Make your changes
python main.py shop update <shop-id> --name "New Name"

# Step 4: If something goes wrong, rollback
python main.py backup rollback <shop-id>

# Restores to: 20260406_120030
# Shop data restored in 30 seconds
```

**Auto-Backup:** Shop deletion automatically creates backup. Restore with:
```bash
python main.py backup restore <shop-id> --timestamp <timestamp>
```

---

### Scenario 4: Promote Shop to Production

**Goal:** Safely move tested shop configuration from staging to production.

```bash
# Step 1: Verify health in staging
export CLI_ENV=staging
python main.py health check <shop-id> --full

# Output:
# Shop Health Score: 95/100 ✓ Ready for production
# Database: ✓ Connected
# Products: ✓ 156 items
# Collections: ✓ 8 collections
# Payment: ✓ Configured
# Domain: ✓ Valid certificate

# Step 2: If not 100%, fix issues (auto-fix available)
python main.py health check <shop-id> --auto-fix

# Step 3: Create backup before syncing
python main.py backup create <shop-id>

# Step 4: Preview production sync
export CLI_ENV=production
python main.py sync config <shop-id> \
  --from staging \
  --to production \
  --dry-run

# Output shows all changes that will be applied

# Step 5: Execute promotion
python main.py sync config <shop-id> \
  --from staging \
  --to production

# Auto-backup created in production
# Sync completed: 45 fields updated
```

**Hierarchy:** Can only sync in direction: dev → acceptance → staging → production

---

### Scenario 5: Check Shop Health

**Goal:** Diagnose why a shop isn't working properly.

```bash
# Step 1: Run health check
python main.py health check <shop-id> --full

# Output includes:
# Score: 75/100 ⚠ Needs attention
# Issues:
# - Payment gateway not configured
# - SSL certificate expired in 2 days
# - 3 broken product links
# Recommendations:
# - Configure payment: https://docs.example.com/payment
# - Renew certificate before 20260410
# - Review products with broken links

# Step 2: Auto-fix what's possible
python main.py health check <shop-id> --auto-fix

# Fixed:
# ✓ Renewed SSL certificate
# ✓ Fixed 3 broken links
# ⚠ Still need: Payment gateway config

# Step 3: Verify improvement
python main.py health check <shop-id>

# New score: 90/100 ✓ Ready for launch
```

**Score Interpretation:**
- 90-100: Ready for production
- 80-89: Minor issues, can operate with monitoring
- <80: Should fix before going live

---

### Scenario 6: Monitor Shop Operations

**Goal:** Review what happened during the day.

```bash
# Step 1: View recent audit log
python main.py audit view --limit 20

# Output:
# Timestamp             | Action     | Shop    | User      | Status
# 20260406_153000       | SYNC_START  | shop-1  | admin     | SUCCESS
# 20260406_150000       | BACKUP_END  | shop-2  | system    | SUCCESS
# 20260406_120000       | BATCH_START | all     | devops    | SUCCESS

# Step 2: Filter by specific shop
python main.py audit view --shop <shop-id> --limit 50

# Step 3: Export for compliance
python main.py audit view --json > audit_export.json

# Step 4: Check for failures
python main.py audit view --status failed --limit 20

# Output shows:
# What failed
# When it happened
# Error message
# Recommended action
```

---

## Disaster Recovery

### Scenario: Accidentally Deleted Shop

```bash
# Step 1: Check if backup exists
python main.py backup list <shop-id>

# Output:
# ✓ Auto-backup created at: 20260406_143000

# Step 2: Restore backup
python main.py backup restore <shop-id> --timestamp 20260406_143000

# Step 3: Verify restoration
python main.py shop get <shop-id>

# Shop is back online!
```

### Scenario: Corrupted Data

```bash
# Step 1: Identify issue
python main.py health check <shop-id> --full

# Step 2: Find good backup
python main.py backup list <shop-id>

# Step 3: Restore from clean backup
python main.py backup restore <shop-id> --timestamp 20260405_090000

# Step 4: Apply changes again (if needed)
python main.py backup create <shop-id>
python main.py shop update <shop-id> --name "Fixed Name"
```

---

## Command Reference

### Shop Commands

```bash
# Create shop
python main.py shop create --name "Name" --domain domain.com --owner-email owner@example.com --template template_name

# List all shops
python main.py shop list
python main.py shop list --json  # Machine-readable

# Get specific shop
python main.py shop get <shop-id>

# Update shop
python main.py shop update <shop-id> --name "New Name" --dry-run

# Delete shop (auto-backup created)
python main.py shop delete <shop-id> --force

# Eject shop (remove from system completely)
python main.py shop eject <shop-id> --force
```

### Backup Commands

```bash
# Create backup
python main.py backup create <shop-id>

# List backups
python main.py backup list <shop-id>

# Restore backup
python main.py backup restore <shop-id> --timestamp 20260406_120000

# Rollback to previous state
python main.py backup rollback <shop-id>

# Delete old backups
python main.py backup delete <shop-id> <timestamp> --force

# Cleanup auto mode (removes backups older than retention days)
python main.py backup cleanup --auto
```

### Batch Operations

```bash
# Create shops from CSV
python main.py batch create shops.csv --dry-run
python main.py batch create shops.csv --parallel 10

# View batch status
python main.py batch list

# Export batch results
python main.py batch list --json > results.json
```

### Health Checks

```bash
# Quick health check
python main.py health check <shop-id>

# Detailed report
python main.py health check <shop-id> --full

# Auto-fix issues
python main.py health check <shop-id> --auto-fix

# Check all shops
python main.py health check --all
```

### Environment Sync

```bash
# Preview sync
python main.py sync config <shop-id> --from staging --to production --dry-run

# Execute sync
python main.py sync config <shop-id> --from staging --to production

# Valid directions only: dev → acceptance → staging → production
```

### Audit Commands

```bash
# View audit log
python main.py audit view --limit 50

# Filter by shop
python main.py audit view --shop <shop-id>

# Filter by action
python main.py audit view --action SHOP_CREATED

# Filter by status
python main.py audit view --status failed

# Export audit
python main.py audit view --json > audit.json

# Audit summary
python main.py audit summary
```

---

## Configuration

### Environment Variables

```bash
CLI_ENV=dev|acceptance|staging|production     # Environment
API_URL=http://api:3000/api                   # Backend URL
API_KEY=your-api-key                          # Authentication
BACKUP_RETENTION_DAYS=30                      # Backup storage
MAX_PARALLEL_WORKERS=10                       # Parallelism
PYTHONUNBUFFERED=1                            # Logging
```

### Config File (~/.ecommerce-cli/config.json)

```json
{
  "env": "production",
  "api_url": "https://api.example.com/api",
  "api_key": "sk-live-abc123...",
  "backup_retention_days": 30,
  "max_parallel_workers": 20
}
```

---

## Best Practices

### ✓ Do's

- ✓ Always use `--dry-run` before risky operations
- ✓ Create backup before major changes
- ✓ Review audit trail after batch operations
- ✓ Use `--json` for automation/scripting
- ✓ Start batch operations with small parallel counts
- ✓ Check health score before production launch
- ✓ Keep API keys in environment variables, not commits

### ❌ Don'ts

- ❌ Never skip `--dry-run` in production
- ❌ Don't delete without backup
- ❌ Don't run large batches without testing first
- ❌ Don't ignore health check warnings
- ❌ Don't use interactive mode in scripts
- ❌ Don't commit API keys to git
- ❌ Don't manually edit backup files

---

## Common Errors & Solutions

### Error: "AuthenticationError"

**Problem:** API authentication failed.

```bash
# Check credentials
python main.py config --show

# Verify API key is correct
echo $API_KEY

# Try reconfiguring
python main.py config setup
```

### Error: "ShopNotFoundError"

**Problem:** Shop ID doesn't exist.

```bash
# List all shops to find correct ID
python main.py shop list

# Verify shop ID wasn't deleted
python main.py audit view --action shop --limit 100
```

### Error: "ValidationError: Invalid email"

**Problem:** Input doesn't meet validation rules.

```bash
# Check command help for required format
python main.py shop create --help

# Examples of valid inputs:
# Email: user@company.com (must be valid email)
# Domain: example.com (must be valid domain)
# Name: "Store Name" (2-100 characters)
```

### Error: "Timeout: Request took too long"

**Problem:** API server not responding quickly.

```bash
# Check API server status
curl -I https://api.example.com/api/health

# Increase timeout
export API_TIMEOUT=60

# Try again with --verbose for debugging
python main.py shop list --verbose
```

### Error: "DiskSpace: Insufficient space for backup"

**Problem:** No space for backup storage.

```bash
# Check backup directory size
du -sh ~/.ecommerce-cli/backups

# Clean old backups
python main.py backup cleanup --auto

# Or manually delete
python main.py backup list <shop-id>
python main.py backup delete <shop-id> <timestamp> --force
```

---

## Integration Examples

### Integration with GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
- name: Create backup before deployment
  run: |
    python main.py backup create ${{ env.SHOP_ID }}
    
- name: Deploy configuration
  run: |
    python main.py sync config ${{ env.SHOP_ID }} \
      --from staging \
      --to production \
      --json > sync_result.json
      
- name: Verify health
  run: |
    python main.py health check ${{ env.SHOP_ID }}
```

### Integration with Cron (Daily Backups)

```bash
# Add to crontab: crontab -e

# Daily backup at 2 AM
0 2 * * * python /path/to/main.py backup create --all

# Weekly health check Sunday at 3 AM
0 3 * * 0 python /path/to/main.py health check --all --json >> /var/log/cli-health.log
```

### Integration with Python Scripts

```python
import subprocess
import json

# Create backup
result = subprocess.run(
    ["python", "main.py", "backup", "create", shop_id, "--json"],
    capture_output=True,
    text=True
)
backup = json.loads(result.stdout)
print(f"Backup created: {backup['timestamp']}")

# List shops
result = subprocess.run(
    ["python", "main.py", "shop", "list", "--json"],
    capture_output=True,
    text=True
)
shops = json.loads(result.stdout)
print(f"Total shops: {len(shops)}")
```

---

## Performance Guide

### Batch Operation Performance

| Operation | Count | Duration | Memory | CPU |
|-----------|-------|----------|--------|-----|
| shop list | 500 | 2s | 100MB | 100m |
| shop create | 100 | 10m (--parallel 5) | 300MB | 500m |
| shop create | 100 | 5m (--parallel 20) | 600MB | 1000m |
| backup create | 1 | 30s | 200MB | 200m |
| health check all | 50 | 2min | 150MB | 300m |
| sync config | 1 | 45s | 100MB | 100m |

### Optimization Tips

1. **Parallel workers:** Start with 5, scale to 20
2. **JSON output:** Faster than table formatting
3. **Batch operations:** Use CSV for 10+ operations (vs --json)
4. **Health checks:** Run --full sparingly, use quick mode for monitoring
5. **Backups:** Run during off-hours if possible

---

## Support & Troubleshooting

### Getting Help

```bash
# Command help
python main.py shop --help
python main.py shop create --help

# Version information
python main.py --version

# Debug mode (verbose logging)
export LOG_LEVEL=DEBUG
python main.py shop list

# Full configuration dump
python main.py config --show
```

### Contact Support

- Documentation: See PHASE1_IMPLEMENTATION.md through PHASE4_IMPLEMENTATION.md
- Issues: Report in GitHub Issues
- Security: Email security@example.com
- Operations: Slack #ecommerce-platform

### Additional Resources

- [AGENTS.md](AGENTS.md) - Permission & role definitions
- [PHASE1_IMPLEMENTATION.md](PHASE1_IMPLEMENTATION.md) - CLI architecture
- [PHASE2_COMPLETION.md](PHASE2_COMPLETION.md) - Backup & audit system
- [PHASE3_IMPLEMENTATION.md](PHASE3_IMPLEMENTATION.md) - Automation features
- [PHASE4_IMPLEMENTATION.md](PHASE4_IMPLEMENTATION.md) - Deployment & monitoring

---

**Last Updated:** April 6, 2026  
**Version:** 1.0  
**Next Review:** May 6, 2026
