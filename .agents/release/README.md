# 🔖 Release & Versioning — README

---

## Overview

**Semantic Versioning**: v<MAJOR>.<MINOR>.<PATCH>  
**Release Process**: Version bump → changelog → tag → deploy staging → production (window: 09:00–17:00 UTC)  
**Hotfix**: P1 bug = fast-track approval + immediate deploy (even out-of-hours with incident ticket)  

---

## Files

1. **versioning.md** — SemVer format, changelog template, version bumping
2. **release-process.md** — Release checklist, tag, window rules
3. **hotfix-procedure.md** — P1 fast-track approval, backport rules

---

## Version Bumping

Git commits → auto-version via Conventional Commits:
- `feat(...)` → minor version (v2.3.0 → v2.4.0)
- `fix(...)` → patch version (v2.3.0 → v2.3.1)
- `feat!(...)`or `BREAKING CHANGE:` → major version (v2.3.0 → v3.0.0)

---

## Release Process

```
1. Version bump (SemVer)
2. Changelog + release notes
3. Git tag (v2.3.0)
4. Build Docker images
5. Deploy staging → smoke tests
6. Deploy production (09:00–17:00 UTC)
7. Announce (#releases channel)
```

---

## Hotfix (P1 Bug)

```
1. Branch: hotfix/short-desc
2. Fix + test
3. PR review (expedited, 15 min SLA)
4. Merge + version bump (patch)
5. Tag v2.3.5
6. Deploy immediately (even out-of-hours with incident ticket)
7. Post-mortem within 24h
```

---

**See detailed files→** [versioning.md](versioning.md), [release-process.md](release-process.md), [hotfix-procedure.md](hotfix-procedure.md)
