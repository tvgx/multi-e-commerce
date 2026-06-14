# Copilot / AI Assistant Guidelines

Trước khi đề xuất thay đổi:
1. Load [AGENTS.md](../../AGENTS.md) + [rules/.prompt.md](../rules/.prompt.md) + [rules/project.md](../rules/project.md).
2. Hiểu module/API liên quan qua [apps/](../apps/) + [api-doc](../../api-doc/).

Khi làm:
- Yêu cầu mơ hồ → hỏi rõ (env, branch, acceptance).
- Không commit thẳng `main`; tạo PR có mô tả + checklist.
- Code sinh ra phải kèm test; tuân [code-conventions/](../code-conventions/).
- Giữ Zero-File doctrine, multi-tenant, response `BaseResponseDto`; cấm `any`, hardcode, quick-fix.
- Thao tác infra/rủi ro: kèm dry-run, diff, backup, các bước rollback; đổi cấu trúc dữ liệu → mô tả migration + impact.
- Cảnh báo ngay nếu yêu cầu phá multi-tenant hoặc tăng RAM đột biến.
