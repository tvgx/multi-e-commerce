# 📦 Release — Release Process & Procedure

End-to-end release procedure from code freeze to production deployment.

---

## Release Schedule

### Weekly Release Cycle

```
Monday      Tuesday      Wednesday    Thursday   Friday
Work Day 1  Code Freeze  Release Day  Testing    Hotfix Window
Merge PRs   No new feat  Tag + Deploy Verify    Only bugs
            Stabilize    Production   Stable
```

### Monthly Release Planning

**Last Friday of month**: Plan next month's releases
- Review roadmap
- Identify breaking changes
- Plan major version bump timing

---

## Code Freeze Process

### Tuesday Before Release

**9:00 AM UTC - Code Freeze Begins**

```bash
# Announce in Slack
@engineering Code freeze started for v1.5.0 release
Last merge deadline: TODAY 17:00 UTC
Target: Wednesday 9:00 AM release
```

**What CAN merge**:
- ✅ Bug fixes
- ✅ Critical security patches
- ✅ Test/documentation updates
- ✅ Dependency updates (if approved)

**What CANNOT merge**:
- ❌ New features
- ❌ Major refactoring
- ❌ API changes
- ❌ Database schema changes

### Testing & Stabilization

```
14:00 UTC: Final PR deadline
14:30 UTC: Build release candidate
15:00 UTC: Deploy to staging
16:00 UTC: Run full test suite
17:00 UTC: Manual smoke tests
18:00 UTC: Final checks
19:00 UTC: Ready for Wednesday release
```

---

## Release Day Procedure

### Wednesday 09:00 UTC

#### Step 1: Determine Version (09:00)

```bash
# Analyze changes since last release
git log --oneline v1.4.3..origin/troll | grep -E "^feat|^fix|^BREAKING"

# Count commits by type
git log --pretty="%h %s" v1.4.3..origin/troll | \
  awk '{if ($0 ~ /feat:/) f++; if ($0 ~ /fix:/) fx++} \
       END {print "Features:", f, "Fixes:", fx}'

# Decision logic:
# - Any BREAKING CHANGE → Major version bump
# - New features (feat:) → Minor version bump
# - Only fixes (fix:) → Patch version bump

# Example:
# Features: 3
# Fixes: 5
# Decision: MINOR bump (1.4.3 → 1.5.0)
```

#### Step 2: Create Release Branch (09:15)

```bash
VERSION=1.5.0

git checkout -b release/v${VERSION} origin/troll

# Bump version
npm version minor --no-git-tag-version

# Update CHANGELOG.md (see template below)
# Edit: CHANGELOG.md
git add CHANGELOG.md
git commit -m "chore: Update changelog for v${VERSION}"

# Create release commit
git tag -a v${VERSION} -m "Release v${VERSION}"
```

#### Step 3: Create Release PR (09:30)

```bash
git push origin release/v${VERSION}

# Create PR on GitHub
# Title: "Release v1.5.0"
# Link to CHANGELOG
# Request reviews: @tech-lead @product
```

#### Step 4: Code Review (09:30-11:00)

Reviews must confirm:
- [ ] Version number correct
- [ ] Changelog complete & accurate
- [ ] No breaking changes not documented
- [ ] Testing complete
- [ ] Ready for production

#### Step 5: Merge & Deploy (11:00)

```bash
# After 2 approvals merged
git checkout troll
git pull origin troll
git describe --tags  # Verify tag

# Build production images
./scripts/build-images.sh production v${VERSION}

# Push to registry
docker push myregistry.azurecr.io/api-core:v${VERSION}

# Deploy to production (with monitoring)
kubectl set image deployment/api-core \
  api="myregistry.azurecr.io/api-core:v${VERSION}" \
  -n ecommerce --record

# Monitor rollout
kubectl rollout status deployment/api-core -n ecommerce --watch
```

#### Step 6: Publish Release (11:30)

```bash
# GitHub Actions auto-publishes when tag pushed
# Or manual:
git checkout v${VERSION}
gh release create v${VERSION} \
  --title "v${VERSION}" \
  --notes-file RELEASE_NOTES.md \
  --draft  # Review before publishing

# Check GitHub Releases tab
# Publish when ready
```

#### Step 7: Notify Stakeholders (12:00)

```bash
# Slack announcement
@channel 🚀 v1.5.0 released to production!

Features:
✨ Product tags for better organization
✨ Bulk product edit API endpoint

Fixes:
🐛 Cart calculation off-by-one error
🐛 Email validation rejecting valid addresses

Changelog: [link to release notes]
Dashboard: [monitoring link]

Monitoring for next 2 hours. Please report issues immediately.

# Email to customers (if user-facing)
Subject: New Features Live! Product Tags & More

Dear Shop Partners,

We're excited to announce v1.5.0 with new features...
```

---

## CHANGELOG.md Template

```markdown
## [Unreleased]

### Added
- New features being worked on

### Fixed
- Known bugs being fixed

---

## [1.5.0] - 2026-04-09

### Added
- Product tags feature for better organization (#245)
  - Add/remove tags from product details page
  - Filter products by tags in shop admin
  - API: GET /products?tags=tag1,tag2
- Bulk product edit API endpoint (#242)
  - Update price, inventory for multiple products at once

### Fixed
- Cart calculation off-by-one error when quantity > 100 (#240)
- Email validation rejecting valid addresses with + symbol (#244)
- Dashboard slow when shop has > 10k products (#239)

### Changed
- Product search now case-insensitive (improves usability)

### Performance
- Thumbnail generation optimized: 30% faster

### Security
- Updated lodash from 4.17.20 → 4.17.21 (CVE-2025-0001)

### Documentation
- Added API docs for bulk product endpoint
- Updated product tags feature guide

### Breaking Changes
None

### Migration Guide
No database migrations required. New features are backward compatible.
```

---

## Post-Release Monitoring

### First 2 Hours

**Every 15 minutes**:
- [ ] Error rate (target: < 1%)
- [ ] API latency (target: < 500ms p95)
- [ ] Pod health (no crashes)
- [ ] Database connections normal
- [ ] User reports (Slack, support)

```bash
# Quick health check
curl https://api.example.com/health
curl https://admin.example.com/health
kubectl logs deployment/api-core -n ecommerce | grep ERROR | head -10
```

### First 24 Hours

**Hourly checks**:
- [ ] Error logs reviewed
- [ ] No unexpected patterns
- [ ] Monitoring dashboards normal

### First Week

**Daily reviews**:
- [ ] Staging updated to released version
- [ ] All tests still passing
- [ ] Customer feedback positive
- [ ] No regression reports

---

## Release Issues & Rollback

### If Release Causes Issues

**P1 Issue (complete failure)**:
```bash
# Immediate rollback
kubectl rollout undo deployment/api-core -n ecommerce
kubectl rollout status deployment/api-core -n ecommerce --watch

# Verify
curl https://api.example.com/health

# Post to Slack
🚨 ROLLBACK: v1.5.0 rolled back to v1.4.3
Issue: Cart calculation broken
ETA for fix: Thursday afternoon
```

**P2 Issue (degradation)**:
```bash
# Assess: Is rollback needed or can we hotfix?
# If hotfix faster: Create v1.5.1 PR (fix + merge + deploy)
# If rollback faster: Rollback (see above)

# Decision matrix:
# Fix time < 2 hours? → Hotfix v1.5.1
# Fix time > 2 hours? → Rollback to v1.4.3 + hotfix
```

---

## Release Checklist

**Before release**:
- [ ] Code changes reviewed
- [ ] Tests passing (unit + integration)
- [ ] Security scan clean
- [ ] Changelog complete
- [ ] Version bumped
- [ ] Staging deployed & tested

**During release**:
- [ ] Release branch created
- [ ] PR reviewed & approved
- [ ] Version correct
- [ ] Changelog accurate
- [ ] Tag created
- [ ] Production images built
- [ ] Deployment successful
- [ ] Health checks passing

**After release**:
- [ ] Monitored for 2+ hours
- [ ] No critical issues
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Release marked as "released" (not draft)

---

See [README.md](README.md) | [versioning.md](versioning.md) | [hotfix-procedure.md](hotfix-procedure.md)
