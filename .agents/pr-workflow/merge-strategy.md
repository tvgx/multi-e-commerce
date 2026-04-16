# 🔀 Merge Strategy

How to merge PRs, handle conflicts, and keep history clean.

---

## Merge Method: Squash & Merge

**Recommended**:  GitHub \"Squash and merge\" button.

### Why Squash?

- ✅ **Clean history**: 1 PR = 1 commit on main
- ✅ **Easy revert**: `git revert <commit-hash>` removes entire feature
- ✅ **Easy bisect**: `git bisect` finds which commit broke something
- ✅ **Readable log**: `git log --oneline` shows high-level changes

vs.

- ❌ **Merge commits**: Clutters history with merge info
- ❌ **Rebase to main**: Can lose authorship, causes confusion

### How to Squash & Merge

1. **On GitHub**: PR → \"Squash and merge\" button
2. **GitHub automatically**:
   - Combines all commits into 1
   - Uses PR title as commit message
   - Marks as merged
3. **Delete branch**: GitHub auto-offers to delete feature branch

---

## Commit Title on Main

After squash, the commit message on main is:

```
feat(api-core): add product pagination (#234)
```

GitHub automatically adds the PR number.

---

## Handling Conflicts

### If Your PR Has Conflicts

**Message**: \"This branch has conflicts that must be resolved\"

**Options:**

#### Option 1: Rebase Locally (Recommended)

```bash
# Fetch latest main
git fetch origin main

# Rebase your branch
git rebase origin/main

# Resolve conflicts in your editor
# Then mark resolved
git add <file>

# Continue rebase
git rebase --continue

# Force push to update PR
git push origin feature/my-feature --force-with-lease
```

#### Option 2: GitHub UI

Click \"Resolve conflicts\" on PR (only for simple conflicts).

#### Option 3: Merge Main Into Feature

```bash
git checkout feature/my-feature
git fetch origin main
git merge origin/main

# Resolve conflicts
git add <file>
git commit -m \"Merge main into feature/my-feature\"
git push origin feature/my-feature
```

**Why avoid this?** Creates merge commit, clutters history.

---

## Resolving Conflicts

### Example Conflict

```typescript
<<<<<<< HEAD
const getUserId = (user: User) => user.id;  // Your version
=======
function getUserId(user: User): string {     // Main version
  return user.id;
}
>>>>>>> main
```

**Choose**:
- `<<<<<<< HEAD` = your version (feature branch)
- `>>>>>>> main` = main version (base branch)

**Decide**:
```typescript
// Option 1: Keep yours
const getUserId = (user: User) => user.id;

// Option 2: Keep theirs
function getUserId(user: User): string {
  return user.id;
}

// Option 3: Combine
const getUserId = (user: User): string => user.id;
```

### Tips for Conflict Resolution

1. **Understand both versions**: Why did each change happen?
2. **Prefer newer logic**: If logic differs, main's version usually wins (reviewed recently)
3. **Test after resolving**: `npm run test` to ensure no breakage
4. **Ask reviewer**: If unsure, comment in PR: \"How should I resolve this conflict?\"

---

## Branch Protection Rules

Main branch is protected:

- ✅ Requires PR review (1+ approvers)
- ✅ Requires CI/CD to pass (lint, test)
- ✅ Blocks merge if outdated with main
- ✅ Dismisses stale reviews when new commits pushed

**Effect**: You can't push directly to main, even as admin.

---

## After Merge

### Cleanup

```bash
# Delete branch locally
git branch -d feature/my-feature

# Delete remote branch (GitHub usually auto-deletes)
git push origin --delete feature/my-feature

# Fetch latest main
git checkout main
git pull origin main
```

### Update Local Main

```bash
# Switch to main
git checkout main

# Pull merged change
git pull origin main

# Now main is up-to-date with your merged PR
```

---

## Reverting a Merged PR

If a PR had issues after merge:

```bash
# Find the commit hash on main
git log --oneline | grep \"your feature name\"

# Revert it
git revert <commit-hash>

# This creates a new commit that undoes the changes
# Push the revert
git push origin main
```

**Result**: Feature is removed, history shows revert.

---

## Release Branches (if applicable)

Some teams use release branches (we don't, but for reference):

```
main (production)
  ↓
release/v2.3.0 (tag for release)
  ↓
feature/x, feature/y (merged each day)
```

**For this project**: Just use main + tags.

---

## Merge Commit Anatomy

When you \"Squash and merge\":

```
Commit: abc123def456...
Author: alice@company.com
Date:   2026-04-07 14:32:00 +0000

    feat(api-core): add product pagination (#234)
    
    (PR description auto-added by GitHub)
```

---

## CI/CD After Merge

After merge to main:

1. **GitHub Actions runs**:
   - Build + test (should pass, already ran on PR)
   - Build Docker images
   - Push to container registry

2. **Changelog auto-generated** (from Conventional Commits)

3. **Version automatically bumped** (SemVer):
   - `feat` → minor version (v2.3.0 → v2.4.0)
   - `fix` → patch version (v2.3.0 → v2.3.1)
   - `feat!` (breaking) → major version (v2.3.0 → v3.0.0)

---

## Common Merge Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| \"This branch has conflicts\" | main ahead of feature branch | Rebase (see above) |
| \"All conversations resolved?\" | Unresolved review comments | Reviewer must approve most recent commit |
| \"Waiting for status checks\" | CI still running | Wait for green ✅ |
| \"Cannot merge deprecated branch\" | Branch renamed or missing | Use updated branch |

---

## See Also

- [./review-rules.md](./review-rules.md) — how many reviewers
- [../code-conventions/branching-strategy.md](../code-conventions/branching-strategy.md) — branch naming
