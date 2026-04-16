# 📝 Commit Messages

How to write clear, useful commit messages.

---

## Format: Conventional Commits

All commits follow the format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (Required)
One of:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Code style (formatting, missing semicolons, etc.)
- `refactor` — Code reorganization (no logic change)
- `perf` — Performance improvement
- `test` — Adding/updating tests
- `chore` — Build, CI, dependencies (no source code change)

### Scope (Recommended)
The part of the codebase affected:
- `api-core`, `admin`, `cli-tool`, `storefront`
- `database`, `auth`, `products`, `orders`, `layouts`
- `infra`, `k8s`, `docker`

### Subject (Required)
- Imperative mood: "add" not "added" or "adds"
- No period at end
- Max 50 characters
- Lowercase (except proper nouns)

### Body (Optional)
Detailed explanation:
- Why the change?
- What was the problem?
- How does it solve it?
- Max 72 characters per line

### Footer (Optional)
- Reference issues: `Fixes #123`, `Related to #456`
- Breaking changes: `BREAKING CHANGE: ...`

---

## Examples

### Simple Fix
```
fix(api-core): handle null pointer in product resolver
```

### Feature with Body
```
feat(storefront): add lazy loading for product images

Implement Next.js Image optimization with loading="lazy" flag
to improve page load performance. Uses Intersection Observer API
for efficient viewport detection.

Fixes #234
```

### Breaking Change
```
feat(api-core)!: rename product endpoint from /products to /api/v2/products

BREAKING CHANGE: /products endpoint removed. Use /api/v2/products instead.
Customers must update their API clients.
```

### Chore (Dependency Update)
```
chore(deps): upgrade typescript from 5.0 to 5.1

Includes new decorators support and improved type inference.
Fixes #100
```

### Documentation
```
docs(README): add deployment instructions for staging environment

Include step-by-step guide, troubleshooting section, and rollback procedure.
```

---

## Tips

1. **Use imperative mood**: "add feature" not "added feature" or "adds feature"
2. **Don't repeat scope in body**: Already in subject line
3. **Reference related issues**: `Fixes #123` auto-closes GitHub issue
4. **Keep history clean**: Rebase before merge, squash if needed
5. **Review your own commit**: `git log --oneline -5` to check

---

## Why Conventional Commits?

1. **Human-readable**: Easy to understand what changed
2. **Machine-parseable**: Tooling can auto-generate changelogs
3. **SemVer friendly**: `fix` = patch, `feat` = minor, `feat!` = major
4. **Git history**: `git log --grep="feat"` finds all features
5. **Code review**: Easier to spot scope of change

---

## Commits & CI/CD

Your commit message triggers:
- Changelog generation (from `feat` and `fix`)
- Version bumping (from `feat!` = major, `feat` = minor, `fix` = patch)
- Release notes

Example:
```
CHANGELOG.md:
## v2.3.0 (2026-04-07)
### Features
- Add lazy loading for product images (storefront)
- Rename product endpoint to v2 API (api-core)

### Bug Fixes
- Handle null pointer in product resolver (api-core)
```

---

## More Info

- [Conventional Commits Spec](https://www.conventionalcommits.org)
- [Semantic Versioning](https://semver.org)
- [../release/](../release/) — how we version & release
