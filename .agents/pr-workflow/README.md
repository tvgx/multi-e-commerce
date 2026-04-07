# 📝 PR Workflow — README

How to create, review, and merge pull requests.

---

## Quick Checklist (Before You Open PR)

- [ ] Linting: `npm run lint` passes
- [ ] Tests: `npm run test` passes
- [ ] No secrets in code (grep for API keys, passwords)
- [ ] Branch name correct (`feature/`, `fix/`, `chore/`, `hotfix/`)
- [ ] Commits follow [Conventional Commits](commit-messages.md)
- [ ] Updated docs (API, CLI, schema changes)
- [ ] Coverage: new code has ≥ 70% test coverage

---

## The PR Lifecycle

```
1. Create branch: feature/my-feature
2. Commit: follow Conventional Commits
3. Push: git push origin feature/my-feature
4. Open PR: fill template (see template.md)
   ↓
5. CI/CD runs: lint + test + coverage
   ├─ ✅ All pass: ready for review
   └─ ❌ Some fail: fix & push again
   ↓
6. Review (≥1 person, see review-rules.md)
   ├─ ✅ Approved: ready to merge
   └─ 🔄 Changes requested: discuss & fix
   ↓
7. Merge: squash to main
   ↓
8. Delete branch (auto or manual)
```

---

## Files in This Section

1. **[checklist.md](checklist.md)** — What to do before opening PR
2. **[template.md](template.md)** — PR description template
3. **[review-rules.md](review-rules.md)** — How many reviewers? Labels? Etc.
4. **[merge-strategy.md](merge-strategy.md)** — Squash? Rebase? Conflicts?

---

## Example: From Feature to Main

```bash
# 1. Create feature branch
git checkout main && git pull origin main
git checkout -b feature/product-pagination

# 2. Code & commit (multiple commits OK)
npm run lint --fix
npm run test
git commit -m "feat(api-core): add pagination support to products API"

# 3. Push & open PR
git push origin feature/product-pagination
# → Open on GitHub, fill PR template

# 4. CI runs, reviewers comment
# → Make changes if needed
git commit -m "fix: handle edge case in pagination cursor"
git push origin feature/product-pagination

# 5. Approved & merged (squash to main)
# GitHub button: "Squash and merge"

# 6. Cleanup
git branch -d feature/product-pagination
git push origin --delete feature/product-pagination
```

---

## Next Steps

1. Before opening PR: [checklist.md](checklist.md)
2. When opening PR: [template.md](template.md)
3. During review: [review-rules.md](review-rules.md)
4. When merging: [merge-strategy.md](merge-strategy.md)

---

**More info?** → [../code-conventions/](../code-conventions/) (commit format, branch naming)
