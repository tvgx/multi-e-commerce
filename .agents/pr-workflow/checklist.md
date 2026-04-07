# ✅ PR Checklist

What to verify **before** opening a pull request.

---

## Pre-Submission Checklist

### Code Quality
- [ ] Code linted: `npm run lint` (or `flake8` for Python) — must pass
- [ ] Tests written: new code has corresponding tests
- [ ] Tests pass: `npm run test` — 100% pass rate
- [ ] Coverage: new code ≥ 70% test coverage (check `npm run test:cov`)
- [ ] No console.log/print statements in production code
- [ ] No TODOs without tickets (e.g., `// TODO: Refactor this - JIRA-123`)

### Code Standards
- [ ] Follows [code-conventions/](../code-conventions/) for your language
  - TypeScript: strict mode, type hints, no `any`
  - Python: type hints, docstrings, flake8 passes
- [ ] Naming conventions followed (camelCase, PascalCase, snake_case as applicable)
- [ ] Error handling: try/catch, proper error messages

### Browser/Runtime
- [ ] Code runs locally without errors
- [ ] If UI change: tested in Chrome, Firefox, Safari (or main target browsers)
- [ ] If backend: tested with test data, no hardcoded values

### Documentation
- [ ] README.md updated (if feature is user-facing)
- [ ] API docs updated (if new endpoints added)
- [ ] CLI help updated (if new commands added)
- [ ] Code comments added for complex logic
- [ ] Docstrings added (TypeScript/Python)

### Secrets & Security
- [ ] No secrets committed (grep for: `password`, `api_key`, `secret`, `token`)
  ```bash
  git diff HEAD~1 | grep -E "(password|api_key|secret|token|AWS_KEY)"
  ```
- [ ] No sensitive logs (PII, payment info, emails)
- [ ] No hardcoded environment-specific URLs/IPs

### Git Hygiene
- [ ] Branch name follows convention (`feature/`, `fix/`, `chore/`, `hotfix/`)
  - Correct: `feature/product-pagination`, `fix/null-pointer-error`
  - Wrong: `my-feature`, `FEATURE/ProductPagination`, `update-stuff`
- [ ] Commit messages follow [Conventional Commits](../code-conventions/commit-messages.md)
  - Format: `type(scope): subject`
  - Examples: `feat(api-core): add pagination`, `fix(admin): layout builder bug`
- [ ] Commits are logical & focused (not too big, not too small)
- [ ] No merge commits (rebase if getting out of sync)
  ```bash
  # If master is ahead, rebase
  git fetch origin main
  git rebase origin/main
  git push origin feature/my-feature --force-with-lease
  ```

### PR Description
- [ ] Title is descriptive (not "Update" or "Fix stuff")
- [ ] Description filled out (use template from `template.md`)
  - [ ] What was the problem?
  - [ ] How does this fix it?
  - [ ] Testing done?
  - [ ] Any breaking changes?
- [ ] Links to related issues (`Fixes #123`, `Related to #456`)
- [ ] Screenshots/GIFs if UI changes
- [ ] Reviewers tagged

### Scope & Impact
- [ ] Understand what this PR changes (impact = small = easier review)
- [ ] If large change: broken into multiple smaller PRs (if possible)
- [ ] Database changes: migration included + rollback plan
- [ ] Infrastructure changes: dry-run output included
- [ ] Performance impact: benchmarks or profiling included (if significant change)

---

## High-Risk Checklist (If Applicable)

### Database Changes
- [ ] Migration file created with both up & down scripts
- [ ] Migration tested locally (apply + rollback + apply)
- [ ] Data loss impact assessed (if any deletions)
- [ ] Backward compatibility ensured (old code runs with new schema)

### Infrastructure Changes (K8s, Docker)
- [ ] Manifest validated: `kubectl --dry-run=client --validate=strict`
- [ ] Dry-run output included in PR description
- [ ] Resource requests/limits set
- [ ] Health checks configured
- [ ] Rollback plan specified

### Dependency Updates
- [ ] Security vulnerabilities fixed (if updating deps)
- [ ] Breaking changes documented (if major version bump)
- [ ] Lock files checked in (package-lock.json, Pipfile.lock)

### API Changes
- [ ] Backwards compatible (if modifying, not adding)
- [ ] Or: has deprecation plan + plan to remove old API
- [ ] OpenAPI/API docs updated
- [ ] Examples in PR showing new usage

---

## Self-Review Checklist

Before requesting review from others:

1. **Read your own code** (like a reviewer would)
   - Would I understand this?
   - Is there a simpler way?
   - Any obvious bugs?

2. **Check CI/CD output**
   - All tests passed?
   - Coverage report shows green?
   - Lint report clean?

3. **Test locally once more**
   ```bash
   # Reset to your branch
   git checkout feature/my-feature
   git pull
   npm install  # or pip install
   npm run test
   npm run lint
   npm run dev  # or python main.py --help
   ```

4. **Compare to main**
   ```bash
   git diff main ~6..origin/main
   ```

---

## Common Issues to Avoid

| Issue | How to Check | Fix |
|-------|---|---|
| Forgot to add tests | `npm run test:cov`, look for red lines | Add tests for new code |
| Lint fails | `npm run lint` | Run `npm run lint --fix` |
| Coverage too low | `npm run test:cov`, check files | Add unit/integration tests |
| Large complex PR | Count files changed, lines changed | Split into smaller PRs |
| Forgotten console.logs | `git diff main \| grep console` | Remove debug statements |
| Secrets leaked | `git diff main \| grep -E "password\|api_key"` | Remove, rotate secret |

---

## Tips

- **Start early**: Don't wait until last minute to open PR
- **Smaller is better**: 200–400 lines is good, 1000+ is hard to review
- **Ask for help**: If unsure, comment in PR before opening
- **Check once more**: Self-review catches 50% of issues
- **Update docs**: Even small changes might need docs update

---

**Ready?** → [template.md](template.md) to write PR description
