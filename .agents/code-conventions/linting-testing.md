# Linting & Testing

CI chặn merge nếu lint hoặc test fail.

| Ngôn ngữ | Lint | Format | Test |
|----------|------|--------|------|
| TS (api-core, admin, storefront) | `npm run lint` (ESLint) | Prettier | api-core: `npm run test` (Jest), `test:cov`; admin: `npm run test:ui` (Playwright) |
| Python (cli-tool) | `flake8` | `black` | `pytest` |
| YAML (k8s) | `yamllint k8s/` | — | — |

- Viết test cho cả case đúng và case lỗi. Coverage tối thiểu: xem [README](README.md).
- Trước commit: lint + test xanh, không còn `console.log`/debug, không lộ secret.
- Lưu ý WSL: jest có thể vỡ do thiếu `@unrs/resolver-binding-linux-x64-gnu` — cài lại `--no-save` sau khi reinstall (xem memory dự án).
