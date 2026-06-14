# Merge Strategy

- **Squash merge** mặc định → lịch sử `main` tuyến tính, dễ revert/bisect 1 feature.
- Điều kiện merge: CI xanh (lint + test + coverage) · đủ approval ([review-rules.md](review-rules.md)) · không conflict (rebase `main` trước).
- Tiêu đề squash giữ format `type(scope): subject`.
- Sau merge: xoá nhánh (local + remote). Branch không merge >2 tuần → dọn.
- Không bao giờ merge thẳng vào `main` không qua PR.
