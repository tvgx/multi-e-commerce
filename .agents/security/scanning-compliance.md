# Scanning & Compliance

## Quét
- Secret scanning (GitHub) tự phát hiện token lộ → cảnh báo + thu hồi.
- Dependency/vuln scanning trên CI. Lưu ý: dự án vá 4 vuln bằng `npm overrides` (esbuild 0.28.1, bull>uuid 14) — **đừng gỡ**; đổi override phải clean reinstall.
- Có thể thêm pre-commit hook quét secret trước khi push.

## Tuân thủ
- Audit log thao tác rủi ro (append-only, mã hóa), export định kỳ cho compliance.
- Retention prod ≥90 ngày. Báo cáo sự cố bảo mật qua #security + escalation P1/P2.
- Dữ liệu khách (PII): tuân GDPR-like — chỉ thu thập đủ dùng, xoá theo yêu cầu hợp lệ.
