# 💻 Code Conventions — README

Guidelines for writing clean, consistent, testable code across the project.

---

## Files in This Section

1. **[branching-strategy.md](branching-strategy.md)** — Branch naming conventions
   - `feature/`, `fix/`, `chore/`, `hotfix/` prefixes
   - Examples: `feature/product-pagination`, `fix/api-null-pointer`

2. **[commit-messages.md](commit-messages.md)** — Conventional Commits format
   - `type(scope): subject`
   - Examples, best practices

3. **[linting-testing.md](linting-testing.md)** — Code quality enforcement
   - ESLint, Prettier, `npm run test`
   - CI/CD enforcement (no merge if tests fail)

4. **[typescript-styles.md](typescript-styles.md)** — TypeScript best practices
   - Strict mode, no `any`, type hints
   - Async/await > callbacks

5. **[python-styles.md](python-styles.md)** — Python best practices
   - Type hints, docstrings (Google style)
   - venv, requirements.txt management

---

## One-Minute Summary

```bash
# 1. Create a branch with proper naming
git checkout -b feature/product-pagination

# 2. Code (with linting & tests)
npm run lint          # Must pass
npm run test          # Must pass

# 3. Commit with Conventional Commits format
git commit -m "feat(api-core): add product pagination with cursor support"

# 4. Push & open PR
git push origin feature/product-pagination
# → PR auto-checks: lint, test, coverage

# 5. Merge (squash recommended)
# → CI passes
# → Reviewer approves
# → GitHub squash-merges to main
```

---

## Quick Checklist

Before **committing**:
- [ ] Code linted: `npm run lint` passes
- [ ] Tests written: relevant test files updated
- [ ] Tests pass: `npm run test` passes
- [ ] No secrets: grep for API keys, passwords
- [ ] Commit message follows Conventional Commits

Before **pushing**:
- [ ] Branch name is correct (`feature/*`, `fix/*`, etc.)
- [ ] Rebase on main (avoid merge commits)
- [ ] No console.log or debug code left

Before **opening PR**:
- [ ] All above checks ✅
- [ ] PR description uses template (see `../pr-workflow/template.md`)
- [ ] Tests added/updated (minimum 70% coverage for new code)
- [ ] Docs updated (if API/schema/CLI changes)
- [ ] Reviewers tagged

---

## File Organization by Language

### TypeScript (Next.js, NestJS)
- `src/` — source code
- `src/components/`, `src/services/`, `src/utils/` — organized by domain
- `*.test.ts` or `__tests__/` — test files collocated or grouped
- `tsconfig.json` — strict mode, noImplicitAny: true

### Python (CLI Tool)
- `*.py` — source files
- `test_*.py` — test files
- `venv/` — virtual environment (gitignored)
- `requirements.txt` — dependencies

---

## Linting & Formatting

**TypeScript/JavaScript**:
```bash
npm run lint          # Check for issues
npm run lint --fix   # Auto-fix if possible
```

**Python**:
```bash
flake8 src/
black src/            # Auto-format
```

**YAML (K8s)**:
```bash
yamllint k8s/         # Validate YAML syntax
```

---

## Test Coverage Requirements

| Code Type | Min Coverage | Notes |
|---|---|---|
| Core business logic | 80–90% | High-value targets |
| API routes | 70–80% | Positive + error cases |
| Utils | 70% | Common cases |
| UI components | 50–70% | Happy path + error states |
| Infrastructure | 0% | Manual testing, not unit tests |

---

## Next Steps

1. Pick your language: [TypeScript](typescript-styles.md) or [Python](python-styles.md)
2. Understand branch naming: [branching-strategy.md](branching-strategy.md)
3. Learn commit format: [commit-messages.md](commit-messages.md)
4. Set up linting: [linting-testing.md](linting-testing.md)

---

**Still learning?** → [../pr-workflow/](../pr-workflow/) (how to submit PR)
