# 📖 Core Rules — README

This section contains the **foundational principles** that govern the entire project.

---

## Files in This Section

1. **[principles.md](principles.md)** — 8 core rules everyone follows
   - No direct push to main
   - Always check AGENTS.md for permissions
   - Never commit secrets
   - Audit all risky operations
   - etc.

2. **[roles-permissions.md](roles-permissions.md)** — Quick reference for 6 main roles
   - Developer, Shop Admin, Ops Admin, Platform Admin, K8s SA, CI/CD
   - What each role can & cannot do
   - API key rotation schedule

3. **[escalation-contacts.md](escalation-contacts.md)** — Who to call when
   - Support channels (Slack, PagerDuty)
   - Escalation levels (team lead → ops → platform admin)
   - On-call procedures
   - Emergency response (P1/P2/P3)

---

## Quick Answers

**"Can I push directly to main?"**  
→ No. See [principles.md](principles.md#1-never-push-directly-to-main)

**"Can I run `shop delete` as a developer?"**  
→ No. Check your role in [../AGENTS.md](../../AGENTS.md) → [roles-permissions.md](roles-permissions.md)

**"Where do I store secrets?"**  
→ Dev: `.env` (local). Prod: Azure Key Vault. See [principles.md](principles.md#3-never-write-secrets-to-code-or-logs)

**"Production is down, what do I do?"**  
→ See [escalation-contacts.md](escalation-contacts.md#incident-response)

**"Do I need approval to deploy to staging?"**  
→ Check [../high-risk-ops/operations-matrix.md](../high-risk-ops/operations-matrix.md)

---

## Learning Path

1. Read [principles.md](principles.md) first (foundational)
2. Identify your role in [roles-permissions.md](roles-permissions.md)
3. Know who to call in [escalation-contacts.md](escalation-contacts.md)
4. Then dive into specific sections (code-conventions, pr-workflow, high-risk-ops, etc.)

---

**Next?** → [../code-conventions/](../code-conventions/) (commit messages, branching, linting)
