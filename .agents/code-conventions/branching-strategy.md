# Branching

Format: `<type>/<mô-tả-ngắn>` — `type` ∈ `feature` · `fix` · `chore` · `hotfix` · `refactor` · `perf`.

- Mô tả ngắn (≤50 ký tự), chữ thường, dùng gạch nối. Vd: `feature/product-pagination`, `fix/api-null-pointer`, `hotfix/payment-race-condition`.
- Tránh tên mơ hồ (`my-feature`, `quick-fix`), không viết hoa type, không nhồi nhiều việc vào tên.
- 1 nhánh = 1 việc. Link issue/ticket ở mô tả PR, không ở tên nhánh.

## Luồng
```bash
git checkout main && git pull
git checkout -b feature/<x>
# code → commit → push → PR (CI lint/test) → reviewer duyệt → squash merge
git push origin --delete feature/<x>   # xoá sau merge
```

Trước merge: rebase trên `main` (`git rebase origin/main`), force-push an toàn `--force-with-lease`. Ưu tiên **squash merge** (lịch sử tuyến tính, dễ revert/bisect).

## Hotfix (P1 prod)
Nhánh từ `main` → `hotfix/<x>` → fix → PR nhãn `risk/critical`, tag @platform-admin/@sre, SLA review 15' → merge → bump version + tag → deploy.

Xem [commit-messages.md](commit-messages.md), [../pr-workflow/](../pr-workflow/).
