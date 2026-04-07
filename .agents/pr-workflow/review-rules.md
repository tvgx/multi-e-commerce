# 👥 Review Rules

Who must review? How many? What labels?

---

## Minimum Reviewers Required

| Scope | Min Reviewers | Notes |
|-------|---|---|
| **Bug fix (dev)** | 1 | Dev environment only |
| **Feature (dev)** | 1–2 | Feature lead required if ≥1 owner |
| **Infra / K8s (staging)** | 2 | SRE + Tech lead |
| **Database schema** | 2 | DBA + core owner |
| **Production hotfix** | 2 | On-call + platform admin (expedited) |
| **Docs** | 1 | Tech lead or domain owner |

---

## Reviewer Selection

### Tech Lead (@tech-lead)
For all PRs (first pass review).

### Feature Owner (@feature-owner)
For features in your domain (product, orders, auth, etc.).

### Domain Experts (@dba, @sre)
For specialized changes:
- Database schema → @dba
- Infrastructure (K8s, Docker) → @sre
- Performance → @sre
- Security → @security-lead

---

## Labels (Apply to PR)

Add label(s) to categorize:

### BY TYPE

| Label | When |
|-------|------|
| `type/feature` | New feature |
| `type/fix` | Bug fix |
| `type/docs` | Documentation only |
| `type/chore` | Build, CI, deps |
| `type/refactor` | Code reorganization |
| `type/perf` | Performance improvement |

### BY RISK LEVEL

| Label | When | Required Action |
|-------|------|---|
| `risk/low` | Docs, minor fix | 1 reviewer, fast-track |
| `risk/medium` | Feature, moderate scope | 1–2 reviewers, standard review |
| `risk/high` | Large feature, major change | 2 reviewers, careful review |
| `risk/critical` | Delete shops, restore backup, prod sync | 2 approvals + emergency protocol |

### BY APP

| Label | When |
|-------|------|
| `app/admin` | Affects admin dashboard |
| `app/api-core` | Affects API backend |
| `app/cli-tool` | Affects CLI tool |
| `app/storefront` | Affects storefront engine |

### BY PRIORITY

| Label | When |
|-------|------|
| `priority/p0` | Blocks release, top priority |
| `priority/p1` | Important, should be in release |
| `priority/p2` | Nice to have, next sprint |

---

## Review SLA

| Type | SLA | Notes |
|---|---|---|
| Feature (dev) | 24 hours | Standard turnaround |
| Hotfix (prod) | 15 minutes | Emergency expedited |
| Docs | 12 hours | Usually quick |
| Chore/deps | 48 hours | Lower priority |

---

## Comments & Updates

### Reviewer Comments

Reviewers can:
- ✅ **Approve**: "Looks good!"
- 🔄 **Request changes**: "Please fix X before merge"
- 💬 **Comment**: "Why did you do this?" (no block, just FYI)

### Author Response

Author should:
1. **Address all feedback**: Respond to each comment (✓ or explain)
2. **Push fixes**: New commits or force-push to same branch
3. **Ping reviewer**: Comment `@reviewer Done, please re-review`
4. **Update PR description**: If changes significant

### Handling Disagreement

If author disagrees:
1. **Discuss in comment**: Explain your reasoning
2. **Loop in tech lead**: If can't agree, escalate
3. **Consensus wins**: Team decision > individual preference

---

## Approval & CODEOWNERS

GitHub CODEOWNERS file (`.github/CODEOWNERS`):

```
# Entire repo
* @tech-lead

# Apps
apps/admin/ @admin-team
apps/api-core/ @backend-team
apps/cli-tool/ @devops-team
apps/storefront/ @frontend-team

# Infrastructure
k8s/ @sre-team
docker/ @sre-team
.github/workflows/ @sre-team

# Database
database/ @dba-team
```

**Effect**: GitHub auto-requests reviews from code owners.

---

## Review Checklist (For Reviewers)

When reviewing a PR:

- [ ] **Understand the change**: Read description, linked issues
- [ ] **Scope check**: Is it too large? Ask for split if yes
- [ ] **Code quality**: Follow conventions? Tests? Docs?
- [ ] **Functionality**: Does it work as described?
- [ ] **Security**: No hardcoded secrets? Proper input validation?
- [ ] **Performance**: Efficient? Any regressions?
- [ ] **Tests**: Adequate coverage? Edge cases handled?
- [ ] **Documentation**: Updated accordingly?
- [ ] **Backward compatibility**: Any breaking changes?

---

## Approval Process

```
1. Open PR
2. CI/CD runs (lint, test, coverage)
3. Reviewers receive notification
4. Reviewers leave comments (approve/request changes/comment)
5. If changes requested:
   - Author fixes
   - Re-request review (comment @reviewer Done)
   - Reviewer approves again
6. Once approved & all CI passes:
   - Click "Squash and merge"
   - GitHub adds commit to main
7. Branch auto-deleted
```

---

## Fast-Track (Expedited) PR Review

For P1 hotfixes:

1. **Label**: `risk/critical` + `priority/p0`
2. **Title**: `HOTFIX: <description>`
3. **SLA**: 15-minute review
4. **Reviewers**: @platform-admin, @sre-on-call
5. **Process**:
   - Tag reviewers directly (Slack mention)
   - Include dry-run & rollback plan
   - Approval = merge immediately (no waiting for others)

Example:
```markdown
## HOTFIX: Payment processing race condition

SLA: 15 min review (P1 incident)

Fixes #1234 (critical)

Rollback: `kubectl rollout undo deployment/api-core`
```

---

## See Also

- [./template.md](./template.md) — PR template
- [../code-conventions/](../code-conventions/) — code standards to review for
- [../high-risk-ops/](../high-risk-ops/) — approval for production ops
