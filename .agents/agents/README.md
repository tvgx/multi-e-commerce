# Agents & Automation

Quy tắc cho tác nhân tự động (CI/CD, K8s job, AI copilot).

- [automation-rules.md](automation-rules.md) — quyền của service account K8s.
- [ci-cd-rules.md](ci-cd-rules.md) — thao tác GitHub Actions được phép.
- [copilot-guidelines.md](copilot-guidelines.md) — khi nào load AGENTS.md / `.agents`.

Cốt lõi: tự động hoá theo least-privilege, không tự thực hiện thao tác CRITICAL (cần người approve), mọi thao tác rủi ro phải audit + dry-run.
