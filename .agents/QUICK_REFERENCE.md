# Quick Reference Card — `.agents/` Cheat Sheet

Print this and pin it to your desk! Or view it when you're stuck. (One-pager version)

---

## 🎯 Find Your Answer

| **I need to...** | **Go here** | **Time** |
|---|---|---|
| Get started (new to project) | `.agents/README.md` | 5 min |
| Learn my role & permissions | `.agents/core-rules/roles-permissions.md` | 5 min |
| Write a good commit message | `.agents/code-conventions/commit-messages.md` | 5 min |
| Prepare PR before opening it | `.agents/pr-workflow/checklist.md` | 10 min |
| Review someone's code | `.agents/pr-workflow/review-rules.md` | 5 min |
| Deploy to production | `.agents/infrastructure/deployment-procedure.md` | 15 min |
| Fix database schema | `.agents/database/schema-changes.md` | 10 min |
| Understand migration safety | `.agents/database/migrations.md` | 10 min |
| Find out how to backup/restore | `.agents/database/backup-restore.md` | 10 min |
| Check service health | `.agents/monitoring/health-checks.md` | 5 min |
| Something's broken (on-call) | `.agents/escalation/support-levels.md` | 10 min |
| Follow incident procedures | `.agents/escalation/on-call-procedures.md` | 10 min |
| Roll something back | `.agents/infrastructure/rollback.md` | 5 min |
| Understand my API | `.agents/apps/api-core/apis/README.md` | 5 min |
| Make an API request | `.agents/apps/api-core/apis/[shops|products|orders|layouts|analytics]-api.md` | 5 min |
| Release a new version | `.agents/release/release-process.md` | 15 min |
| Report a security issue | `.agents/security/scanning-compliance.md` | 5 min |
| Debug something | `.agents/troubleshooting/README.md` | varies |

---

## 📂 Section Quick Map

```
core-rules/              Company rules (principles, roles, contacts)
code-conventions/        How we write code (commits, style, linting)
pr-workflow/             How we review & merge (checklist, template)
high-risk-ops/           Approvals for dangerous operations
infrastructure/          K8s, Docker, deployment, rollback
database/               Migrations, backups, schema changes
monitoring/             Health checks, alerts, observability
security/               Secrets, access, compliance
agents/                 Automation rules (CI/CD, K8s, Copilot)
escalation/             On-call, incidents, severity levels
release/                Versioning, release process
apps/                   Application guides (Admin, API, CLI, Storefront)
templates/              Master layout templates
troubleshooting/        Common issues & diagnosis
```

---

## ✅ Pre-PR Checklist (Copy-Paste)

```
Before opening a PR:

□ Code follows .agents/code-conventions/ standards
□ Tests written (70%+ coverage)
□ Linting/formatting passes (flake8, prettier, eslint)
□ Commits follow .agents/code-conventions/commit-messages.md
□ Branch from main, not another feature branch
□ PR description uses .agents/pr-workflow/template.md
□ Linked to GitHub issue
□ No large files, secrets, or debug code
□ Self-reviewed code once

Ready to open!
```

---

## 🚀 Pre-Deployment Checklist

```
Before deploying to production:

□ Code merged to main and tested
□ New migrations? See .agents/database/migrations.md
□ Within change window? See .agents/infrastructure/deployment-windows.md
□ Read .agents/infrastructure/deployment-procedure.md
□ Create backup (automatic, but verify)
□ Run dry-run first
□ Get required approvals
□ Execute deployment
□ Monitor health checks
□ Run smoke tests
□ Verify no errors in logs
□ Notify stakeholders

You're live!
```

---

## 🚨 Incident Quick Actions

```
When something's broken:

1. Determine severity
   → .agents/escalation/support-levels.md
   P1 = page on-call, P2 = escalate in 15 min

2. Get runbook
   → Either in .agents/escalation/on-call-procedures.md
   → Or in .agents/troubleshooting/README.md

3. Follow steps in runbook

4. Post status in Slack every 15 min
   "Working on X, ETA Y, escalating?: Yes/No"

5. After fix, document root cause
   Update .agents/ if needed
```

---

## 📞 Who to Contact

See `.agents/core-rules/escalation-contacts.md`

```
General questions → #engineering-docs
Code review questions → #engineering
Deployment help → #devops
On-call emergencies → PagerDuty (see on-call doc)
Security issues → #security
```

---

## 🔍 Pro Tips

**Tip 1: Use Ctrl+F**
Most files are long. Open file in VS Code and search for keywords.

**Tip 2: Bookmark often-used files**
- Developers: bookmark `pr-workflow/`, `code-conventions/`
- DevOps: bookmark `infrastructure/`, `escalation/`
- All: bookmark `README.md`, `troubleshooting/`

**Tip 3: Read examples**
Every security/infrastructure file has example YAML, bash commands, or curl requests. Copy-paste them!

**Tip 4: Check related files**
Files link to each other. Follow links to build understanding:
- Read `deployment-procedure.md`
- See link to `deployment-windows.md`
- See link to `rollback.md` 
- Now you understand full deployment lifecycle

**Tip 5: Contribute**
Found a typo or outdated info? Share your fix.
```bash
git checkout -b fix/agents-typo
# Fix it
git push && create PR
```

---

## 🌟 First Week Goals

```
Day 1:
✓ Read .agents/README.md (5 min)
✓ Bookmark your role's section

Day 2–3:
✓ Read role-specific docs (30 min)
✓ Ask questions in #engineering-docs

Day 4–5:
✓ Start using in code/reviews/deployments
✓ Reference docs when helping teammates
```

---

## 📚 Learning Paths by Role

**👨‍💻 Developer (Your first week)**
```
.agents/README.md (START HERE)
  ↓
.agents/core-rules/principles.md
  ↓
.agents/code-conventions/ (all 5 files)
  ↓
.agents/pr-workflow/ (all 4 files)
  ↓
.agents/apps/[your-app]/README.md

Total: 60 minutes
```

**🚀 DevOps/SRE (Your first week)**
```
.agents/README.md (START HERE)
  ↓
.agents/infrastructure/ (all 6 files)
  ↓
.agents/database/ (all 4 files)
  ↓
.agents/escalation/ (all 3 files)
  ↓
.agents/troubleshooting/README.md

Total: 90 minutes
```

**🚨 On-Call Engineer (Your first week)**
```
.agents/README.md (START HERE)
  ↓
.agents/escalation/support-levels.md
  ↓
.agents/escalation/on-call-procedures.md
  ↓
.agents/infrastructure/rollback.md
  ↓
.agents/troubleshooting/README.md (skim all)

Total: 75 minutes
```

---

## ❓ FAQ (Super Quick)

**Q: Do I HAVE to read all 63 files?**
A: No. Read based on role. Most people need 30-90 min total.

**Q: What if something's wrong?**
A: File issue or create PR. Docs are living documents.

**Q: Can I skip this and ask teammates?**
A: You can, but reading is faster + teammates appreciate the self-service.

**Q: Where's the full training guide?**
A: `.agents/TRAINING.md` (much more detailed than this cheat sheet)

---

**Questions?** Ask in #engineering-docs  
**Missing something?** Create GitHub issue  
**Found a typo?** Send a PR  

Welcome to the team! 🚀
