# Code Conventions

Viết code sạch, nhất quán, test được.

- [branching-strategy.md](branching-strategy.md) — đặt tên nhánh `feature/`,`fix/`,`chore/`,`hotfix/`,`refactor/`,`perf/`.
- [commit-messages.md](commit-messages.md) — Conventional Commits `type(scope): subject`.
- [linting-testing.md](linting-testing.md) — `npm run lint`, `npm run test`; CI chặn merge nếu fail.
- [typescript-styles.md](typescript-styles.md) — strict mode, cấm `any`, async/await.
- [python-styles.md](python-styles.md) — type hints, docstring, venv (cli-tool).

## Luồng 1 phút
```bash
git checkout -b feature/<x>
npm run lint && npm run test          # phải xanh
git commit -m "feat(api-core): <mô tả>"
git push origin feature/<x>           # PR → CI tự chạy lint/test/coverage
# reviewer duyệt → squash merge vào main
```

## Coverage tối thiểu
| Loại | Min |
|------|-----|
| Business logic | 80–90% |
| API route | 70–80% |
| Utils | 70% |
| UI component | 50–70% |
| Infra | 0% (test tay) |

Tiếp: [pr-workflow/](../pr-workflow/).
