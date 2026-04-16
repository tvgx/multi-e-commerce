# 🔨 Troubleshooting — README

Common issues, diagnosis steps, and solutions.

---

## Quick Index

| Problem | Diagnosis | Solution |
|---------|---------|----------|
| **Local dev not starting** | See [development-issues.md](development-issues.md) | Check Node version, reinstall dependencies |
| **Deployment failed** | See [deployment-issues.md](deployment-issues.md) | Check logs, rollback, verify manifest |
| **Database connection error** | See [database-issues.md](database-issues.md) | Connection string, credentials, firewall |
| **"Permission denied" on CLI** | See [auth-permission-issues.md](auth-permission-issues.md) | Check AGENTS.md, verify API key role |

---

## How to Use This Section

1. **Identify category** of your problem (above)
2. **Read relevant file** for diagnosis steps
3. **Follow solution** instructions
4. **Still stuck?** Escalate: See `../escalation/support-levels.md`

---

## Files

1. **[development-issues.md](development-issues.md)** — Local dev problems (npm install, builds, hot reload)
2. **[deployment-issues.md](deployment-issues.md)** — K8s, Docker, staging/prod deploy failures
3. **[database-issues.md](database-issues.md)** — PostgreSQL, MongoDB, migrations, connection errors
4. **[auth-permission-issues.md](auth-permission-issues.md)** — Access denied, token expiry, RBAC issues

---

## Before Escalating

- [ ] Check relevant troubleshooting file (above)
- [ ] Review error logs (`kubectl logs`, app console)
- [ ] Try basic fixes (restart, reinstall, clear cache)
- [ ] Google error message ("Error 500 NestJS PostgreSQL" + site:stackoverflow.com)
- [ ] Ask in #engineering Slack

Then escalate: See `../escalation/support-levels.md`

---

**Need help?** Pick a file above or ask teammates.
