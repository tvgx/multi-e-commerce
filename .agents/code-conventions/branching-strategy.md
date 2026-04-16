# 🌳 Branching Strategy

How to name and organize branches in this project.

---

## Branch Naming Convention

### Format
```
<type>/<short-description>
```

Where `<type>` is one of:
- `feature/` — new feature
- `fix/` — bug fix (non-production)
- `chore/` — maintenance, dependency updates, docs
- `hotfix/` — P1 production bug (see Hotfix Procedure below)
- `refactor/` — code reorganization (no functionality change)
- `perf/` — performance improvement

### Examples

✅ Good:
```
feature/product-pagination
feature/add-user-authentication
fix/api-null-pointer-exception
fix/storefront-mobile-layout
chore/upgrade-typescript-5.0
chore/update-eslint-rules
hotfix/payment-race-condition
refactor/extract-api-client
perf/optimize-database-queries
```

❌ Bad:
```
my-feature              # Too vague
quick-fix               # Too vague
update-stuff            # Unclear what was updated
feature/JIRA-123        # Prefer descriptive name (can add ticket in PR)
FIX/PaymentIssue        # Don't capitalize type
feature/add-integration-with-paypal-and-update-checkout-flow  # Too long
```

---

## Recommended Practices

### 1. Keep Descriptions Short
- Max 50 characters (like commit subject)
- Lowercase (except proper nouns)
- Use hyphens (not underscores)

### 2. Link to Ticket (in PR, not branch)
Branch name:
```
feature/product-pagination
```

PR description:
```
Fixes #456  (or reference to JIRA-123)
```

### 3. One Feature = One Branch
- Don't accumulate multiple features in one branch
- Easier to review, easier to rollback if needed

### 4. Delete Branch After Merge
```bash
git push origin --delete feature/product-pagination
# (GitHub automatically offers to delete)
```

---

## Workflow: From Main to Feature to Main

```bash
# 1. Start from latest main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes, commit, push
git commit -m "feat(scope): description"
git push origin feature/my-feature

# 4. Open PR on GitHub
# → CI runs tests, lint
# → Reviewer reviews
# → Approve + merge (squash)

# 5. Delete branch (local + remote)
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## Rebasing vs Merging

**Recommended**: Squash merge (GitHub "Squash and merge" button)

Benefits:
- Clean linear history (no merge commits)
- Easier to bisect if bug introduced
- Easier to revert single feature if needed

```bash
# Before merge: rebase on main
git checkout feature/my-feature
git rebase -i origin/main

# Force push (only safe before merge!)
git push origin feature/my-feature --force-with-lease
```

---

## Hotfix Workflow (Production Bugs)

For critical P1 bugs in production:

```bash
# 1. Branch from main (not develop)
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix & commit
git commit -m "fix(...): ..."

# 3. Open PR (expedited review)
git push origin hotfix/critical-bug
# → Tag reviewers: @platform-admin, @sre
# → Label: `risk/critical`
# → SLA: 15 min review

# 4. Merge (fast-track approval)
# → Close PR

# 5. Version bump & tag
git tag -a v2.3.5 -m "Hotfix: critical bug"
git push origin v2.3.5

# 6. Deploy to production
# (same procedure as normal deployment)
```

---

## Branch Cleanup

**Dead branches** (auto-deleted after merge):
- GitHub: "Head branch was deleted" (auto-cleanup enabled)
- Locally: `git branch -d <branch>` after merge

**Stale branches** (not merged in 2+ weeks):
```bash
# Find stale branches
git branch -v | grep gone

# Delete old branches locally
git branch -D old-branch-name
```

---

## Multi-Branch Workflow (if needed)

For complex features needing coordination:

```
main (production)
  ↑
staging (pre-production test)
  ↑
develop (integration branch)
  ↑
feature/big-feature (feature development)
```

But typically: **main ← PR ← feature/\*** is enough.

---

## See Also

- [commit-messages.md](commit-messages.md) — commit message format
- [../pr-workflow/](../pr-workflow/) — PR creation & review
