# Onboarding `.agents/`

Lộ trình đọc theo vai trò (không cần đọc hết).

**Developer (~60'):** [README](README.md) → [core-rules/principles.md](core-rules/principles.md) → [rules/project.md](rules/project.md) (Zero-File) → [code-conventions/](code-conventions/) → [pr-workflow/](pr-workflow/) → app của bạn [apps/](apps/) + [api-doc](../api-doc/).

**DevOps/SRE (~90'):** [README](README.md) → [infrastructure/](infrastructure/) → [database/](database/) → [high-risk-ops/](high-risk-ops/) → [escalation/](escalation/).

**On-call (~75'):** [escalation/support-levels.md](escalation/support-levels.md) → [escalation/on-call-procedures.md](escalation/on-call-procedures.md) → [infrastructure/rollback.md](infrastructure/rollback.md) → [troubleshooting/](troubleshooting/).

Nguyên tắc chung: không push thẳng `main`, kiểm [AGENTS.md](../AGENTS.md) trước thao tác quyền, không lộ secret, dry-run trước thao tác rủi ro, không quick-fix. Chi tiết kỹ thuật từng module: [api-doc](../api-doc/).
