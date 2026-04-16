# 📦 Release — Versioning & SemVer

Semantic versioning, version bumping, and release planning.

---

## Semantic Versioning (SemVer)

### Format: MAJOR.MINOR.PATCH

```
Version: 2.1.3
         └─┬─┘└─┬─┘└─┬─┘
          │     │     └─ PATCH (bug fixes)
          │     └─────── MINOR (backward-compatible features)
          └───────────── MAJOR (breaking changes)
```

### When to Bump

#### MAJOR (Breaking Change)

```
Old API:   GET /api/products → returns {id, name, price}
New API:   GET /api/products → returns {id, name, price, category}

// Old code breaks if expecting exact fields only
Bump: v1.0.0 → v2.0.0
```

Examples:
- Remove API endpoint
- Change API response format
- Change database schema (breaking)
- Require new environment variable
- Change authentication scheme

#### MINOR (New Feature, Backward Compatible)

```
Old API:   GET /products → returns {id, name, price}
New API:   GET /products → returns {id, name, price, category}

// Old code still works, just ignores new field
Bump: v1.0.0 → v1.1.0
```

Examples:
- Add new API endpoint
- Add optional parameter
- Add new feature flag
- New database schema (with migration)
- New environment variable (with default)

#### PATCH (Bug Fix, No Feature Change)

```
Bug: Product price calculation incorrect
Fix: Corrected Math.round() rounding
Bump: v1.0.0 → v1.0.1
```

Examples:
- Bug fix (any)
- Security patch
- Performance improvement (no API changes)
- Documentation update

---

## Branching & Release Dates

### Main Branch Releases

**Release cadence**: Weekly on Wednesdays

```
Week of April 7:   Release v1.5.0 on Wednesday April 9
Week of April 14:  Release v1.5.1 on Wednesday April 16
Week of April 21:  Release v1.6.0 on Wednesday April 23
```

### Version Bump Timeline

```
Monday:    PR merged, code in troll/main
Tuesday:   Code freeze (no new features)
Wednesday: Release v1.5.0
           - Tag created: v1.5.0
           - GitHub release published
           - Deployed to production
           - Changelog published
Thursday:  Verify in production, post-release testing
Friday:    Release retrospective (if incident)
```

---

## Publishing Releases

### 1. Determine Version

```bash
# Check current version
cat package.json | jq .version

# Current: 1.4.3

# What changed?
git log --oneline v1.4.3..origin/troll | head -20
# - feat: Add product tags (MINOR)
# - fix: Cart calculation (PATCH)
# - fix: Email validation (PATCH)

# Decision: New features → MINOR bump
# New version: 1.5.0
```

### 2. Create Release Branch

```bash
# From origin/troll (main development)
git checkout -b release/v1.5.0 origin/troll

# Update package.json
npm version minor  # Bumps: 1.4.3 → 1.5.0

# Update changelog
# (Edit CHANGELOG.md manually)

# Commit & push
git commit -am "chore: Bump version to 1.5.0"
git push origin release/v1.5.0
```

### 3. Create Pull Request

```
Title: Release v1.5.0

Description:
## Version: 1.5.0
## Release Date: 2026-04-09

### Changes Since v1.4.3
- Added product tags feature
- Fixed cart calculation bug
- Fixed email validation issue

### Changelog
See CHANGELOG.md

### Testing
- ✅ All tests passing
- ✅ Staging deployment verified
- ✅ Manual smoke tests passed
```

### 4. Merge & Tag

```bash
# Merge PR (requires 2 approvals)
# Merge commit: "Merge branch 'release/v1.5.0'"

# Pull latest
git pull origin troll

# Create annotated tag
git tag -a v1.5.0 -m "Release v1.5.0: Product tags, bug fixes"

# Push tag
git push origin v1.5.0

# GitHub automatically detects tag and creates release
```

### 5. Publish to NPM (If Library)

```bash
# From release branch
npm login
npm publish

# Or automated via GitHub Actions:
# Check .github/workflows/publish.yml
```

---

## Changelog Format

### CHANGELOG.md Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Support for custom color schemes ([#245](link))
- New product variant API endpoint

### Fixed
- Cart not updating on quantity change ([#248](link))

### Changed
- Product search now case-insensitive

## [1.5.0] - 2026-04-09

### Added
- Product tags feature for better organization
- Bulk product edit API endpoint ([#242](link))

### Fixed
- Cart calculation off-by-one error ([#240](link))
- Email validation rejecting valid addresses ([#244](link))

### Changed
- Improved product search performance (20% faster)

### Performance
- Thumbnail generation optimized (30% faster)

### Dependencies
- Updated lodash from 4.17.20 → 4.17.21 (security patch)

## [1.4.3] - 2026-04-02

### Fixed
- Memory leak in analytics processor
- Dashboard not loading for shops with 10k+ products
```

---

## Version Constraints in Dependencies

### For Library Consumers

When using this library in other projects:

```json
// package.json (consumer app)
{
  "dependencies": {
    "ecommerce-platform": "^1.5.0"  // Compatible with 1.5.x, 1.6.x, not 2.0.0
  }
}
```

**Caret ranges**:
- `^1.5.0` → Allow `1.5.0, 1.5.1, 1.6.0, 1.99.0` but NOT `2.0.0`
- `^2.0.0` → Allow `2.0.0, 2.1.0, 2.99.0` but NOT `3.0.0`

---

## Hotfix Releases

### For Critical Bugs in Production

**Scenario**: Bug found in v1.5.0 after release

```bash
# 1. Create hotfix branch from tag
git checkout -b hotfix/v1.5.1 v1.5.0

# 2. Fix the bug
git commit -am "fix: Critical payment bug"

# 3. Bump patch version
npm version patch  # 1.5.0 → 1.5.1

# 4. Push & create PR
git push origin hotfix/v1.5.1
# Create PR against troll (main) + production branch

# 5. Merge when approved
# Tag: v1.5.1

# 6. Deploy to production immediately
./scripts/deploy.sh production v1.5.1
```

---

## Release Checklist

Before release:
- [ ] All PRs merged to troll/main
- [ ] All tests passing
- [ ] Security scan passed
- [ ] Code coverage acceptable (70%+)
- [ ] Version bumped correctly
- [ ] CHANGELOG.md updated
- [ ] Staging deployed & verified
- [ ] Release notes drafted

During release:
- [ ] Pull request created & reviewed
- [ ] 2+ approvals obtained
- [ ] Release branch merged
- [ ] Tag created & pushed
- [ ] GitHub release published
- [ ] Production deployment triggered
- [ ] Monitoring active

After release:
- [ ] Production health checks passed
- [ ] Monitors stable (error rate < 1%)
- [ ] Stakeholders notified
- [ ] Release notes published (blog/email)
- [ ] Post-release testing completed

---

See [README.md](README.md) | [release-process.md](release-process.md) | [hotfix-procedure.md](hotfix-procedure.md)
