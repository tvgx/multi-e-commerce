# Versioning (SemVer)

`MAJOR.MINOR.PATCH`:
- **MAJOR**: thay đổi phá vỡ (breaking API/schema).
- **MINOR**: thêm tính năng tương thích ngược.
- **PATCH**: sửa lỗi tương thích ngược.

- Tag git `vX.Y.Z` khi phát hành; hotfix bump PATCH.
- Changelog sinh từ commit Conventional Commits (`feat`→minor, `fix`→patch, `BREAKING CHANGE`→major).
- API công khai đổi breaking → MAJOR + ghi rõ migration cho client (admin/storefront).
