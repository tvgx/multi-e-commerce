# Commit Messages — Conventional Commits

```
<type>(<scope>): <subject>

<body tùy chọn>
<footer tùy chọn: Fixes #123 / BREAKING CHANGE: ...>
```

**type**: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `chore`.
**scope** (nên có): `api-core`,`admin`,`storefront`,`cli-tool` hoặc module thật (`shop`,`catalog`,`order`,`layout`,`payment`,`cart`,`auth`...), hoặc `infra`,`k8s`,`db`.
**subject**: mệnh lệnh ("add" không "added"), không dấu chấm cuối, ≤50 ký tự, chữ thường.

Ví dụ:
```
fix(catalog): handle null in product resolver
feat(layout): add per-page publish endpoint
chore(deps): bump typescript to 5.x
```

Body (≤72 ký tự/dòng): vì sao đổi, vấn đề gì, giải quyết ra sao. Footer: `Fixes #456`, `BREAKING CHANGE:`.
