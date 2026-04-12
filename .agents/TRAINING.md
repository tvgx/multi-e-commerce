# 🎓 Team Training Guide — Introduction to `.agents/`

How to navigate, use, and contribute to the project documentation system.

---

## What Is `.agents/`?

A **centralized knowledge base** documenting all project rules, procedures, and best practices.

**Location**: `/home/troll/workspaces/ecommerce-platform/.agents/`

**Contents**: 63 markdown files organized by topic (governance, operations, security, applications, etc.)

**Why it exists**: 
- Single source of truth for everything (no conflicting docs)
- Onboard new developers faster
- Reduce mistakes (follow tested procedures)
- Enable AI agents (Copilot, bots) to understand project rules

---

## 5-Minute Quick Start

### 1. **First Day: Read These 3 Files**

```
START HERE:
.agents/README.md
    ↓
Choose your role:
    ├─ Developer? → .agents/core-rules/principles.md
    │             + .agents/code-conventions/
    ├─ Deploying? → .agents/infrastructure/deployment-procedure.md
    └─ On-call?  → .agents/escalation/support-levels.md
```

**Time**: ~20 minutes

### 2. **Before Your First PR: Read**

```
.agents/pr-workflow/checklist.md      (what to check before opening PR)
.agents/pr-workflow/template.md       (how to write PR description)
.agents/code-conventions/commit-messages.md  (commit message format)
```

**Time**: ~10 minutes

### 3. **Before First Deployment: Read**

```
.agents/infrastructure/deployment-procedure.md   (step-by-step)
.agents/infrastructure/environments.md           (dev/staging/prod)
.agents/high-risk-ops/approval-workflow-standard.md  (approvals needed)
```

**Time**: ~15 minutes

---

## Finding Answers: Search Strategy

### "How Do I...?"

| Question | Go To | Time |
|----------|-------|------|
| Set up local dev? | `.agents/infrastructure/environments.md` | 5 min |
| Write a good commit? | `.agents/code-conventions/commit-messages.md` | 3 min |
| Open a PR the right way? | `.agents/pr-workflow/checklist.md` | 10 min |
| Deploy to staging? | `.agents/infrastructure/deployment-procedure.md` | 10 min |
| Fix a database bug? | `.agents/database/schema-changes.md` | 10 min |
| What's my role/permissions? | `.agents/core-rules/roles-permissions.md` | 5 min |
| Incident happened, what do I do? | `.agents/escalation/support-levels.md` | 10 min |
| Review someone's API code? | `.agents/apps/api-core/apis/README.md` | 5 min |
| Need to rollback? | `.agents/infrastructure/rollback.md` | 5 min |
| Make a release? | `.agents/release/release-process.md` | 15 min |

---

## Directory Map (60-Second Overview)

```
.agents/
├── README.md ⭐ START HERE
│
├── core-rules/           📋 Company rules (principles, roles, contacts)
├── code-conventions/     💻 Code standards (commits, PRs, linting)
├── pr-workflow/          📝 Pull request process (checklist, template, review)
├── high-risk-ops/        ⚠️  Approval workflows for critical operations
│
├── infrastructure/       🏗️  K8s, Docker, deployment procedures
├── database/            💾 Migrations, backups, schema changes
├── monitoring/          📊 Health checks, alerts, observability
├── security/            🔐 Secrets, access control, compliance
│
├── agents/              🤖 Automation, CI/CD, Copilot guidelines
├── escalation/          🚨 On-call, incident response, severity levels
├── release/             📦 SemVer, release process, versioning
│
├── apps/                📱 Admin, API Core, CLI Tool, Storefront guides
│   └── api-core/apis/   🔌 Detailed API endpoint documentation
├── templates/           📦 Master layout templates (fashion, electronics, health)
└── troubleshooting/     🔧 Common issues & diagnosis (dev, deploy, db, auth)
```

---

## Common Workflows

### Workflow #1: I'm Starting a Feature

```
1. Read: .agents/pr-workflow/checklist.md
   ✓ Create feature branch: git checkout -b feature/my-feature
   ✓ Follow code conventions: .agents/code-conventions/
   ✓ Write tests (70%+ coverage)

2. Before opening PR:
   ✓ Check checklist: .agents/pr-workflow/checklist.md
   ✓ Format commit: .agents/code-conventions/commit-messages.md
   ✓ Use template: .agents/pr-workflow/template.md

3. Open PR
   ✓ Request 1–2 reviewers
   ✓ Wait for approval
   ✓ Address feedback

4. Merge
   ✓ Squash & merge (recommended)
   ✓ Delete branch
```

**Time**: Varies (feature dependent)

### Workflow #2: I'm Deploying to Production

```
1. Read the procedure: .agents/infrastructure/deployment-procedure.md
   ✓ Pre-deployment checklist
   ✓ Build & push images

2. Schedule within change window:
   .agents/infrastructure/deployment-windows.md
   ✓ Weekdays 09:00–16:00 UTC only

3. Execute:
   ✓ Create change ticket
   ✓ Backup database
   ✓ Run dry-run
   ✓ Get approvals
   ✓ Deploy to production
   ✓ Monitor rollout
   ✓ Run smoke tests

4. Verify:
   ✓ All health checks passing
   ✓ Error rate < 1%
   ✓ Notify stakeholders
```

**Time**: 30–60 minutes

### Workflow #3: I'm On-Call & An Incident Happened

```
1. Determine severity: .agents/escalation/support-levels.md
   ✓ P1? Page on-call lead
   ✓ P2? Escalate in 15 min if not fixed

2. Get runbook: .agents/escalation/on-call-procedures.md
   ✓ Database down? → Database runbook
   ✓ API error? → API runbook
   ✓ Other? → Search in troubleshooting/

3. Follow runbook step-by-step
   ✓ Check service health
   ✓ Review logs
   ✓ Try to fix (or escalate)

4. Update Slack #incidents-live every 15 min
   ✓ Status update
   ✓ ETA for fix
   ✓ Escalation if needed

5. After incident resolved:
   ✓ Document root cause
   ✓ Schedule post-mortem
```

**Time**: Varies (incident dependent)

---

## Reading Tips

### 1. Scan First, Read Deep

```
First pass (2 min):
- Read section headers
- Check table of contents
- Look at code examples

If relevant, do second pass:
- Read full text
- Take notes
- Bookmark for later
```

### 2. Use Examples & Checklists

Every file has:
- ✅ Checklists (copy-paste ready)
- 📋 Examples (step-by-step)
- ⚠️ Warnings (before you break something)

### 3. Cross-Link Navigation

Files link to related docs:

```
In `.agents/infrastructure/deployment-procedure.md`:
"See [rollback.md](rollback.md) if deployment fails"
```

Click through as you read to build mental map.

---

## Contributing to `.agents/`

### If You Find an Error or Outdated Info

1. **Fix it** (if small typo/update)
   ```bash
   git checkout -b fix/agents-typo-in-db-docs
   # Edit file
   git commit -m "fix: Correct outdated migration example in database/migrations.md"
   git push origin fix/agents-typo-in-db-docs
   # Create PR
   ```

2. **Report it** (if unsure)
   ```
   Slack #engineering-docs:
   "Heads up: .agents/infrastructure/environments.md line 45 
   mentions 'K8s version 1.25' but we're on 1.28"
   ```

### If You Learn Something New

**Share your knowledge**!

```
Example: You just discovered a faster way to debug a database issue

1. Create PR with new section in .agents/troubleshooting/database-issues.md
2. Title: "docs: Add faster database debug technique"
3. Include example + before/after

Now future developers benefit from your learning!
```

---

## FAQ: `.agents/` Edition

### Q: Is everything in `.agents/` required to follow?

**A**: Yes for governance (core-rules/) and process (pr-workflow/, infrastructure/).
No for conventions — language/framework may vary slightly.

### Q: What if the docs say one thing, but my team does another?

**A**: Docs are the source of truth. If practice differs:
1. Raise in team meeting
2. Update docs to reflect reality (if the new way is better)
3. Document the old way as deprecated

### Q: Can I skip reading them and just ask teammates?

**A**: You can, but you'll learn faster by reading. Plus:
- Teammates get interrupted for same questions
- Docs have more detail than quick Slack answers
- You'll understand "why" not just "what"

### Q: The docs are huge! Do I need to read all 63 files?

**A**: No! Read based on your role:
- **Developer**: core-rules/, code-conventions/, pr-workflow/, your app's guide
- **DevOps**: infrastructure/, database/, monitoring/, escalation/
- **On-call**: escalation/, troubleshooting/, infrastructure/rollback.md
- **New team member**: README.md, then your role's section

Target: ~2–3 hours total to get up to speed.

### Q: What if the docs don't answer my question?

**A**: 
1. Check the table of contents (might be under different name)
2. Use Ctrl+F to search for keywords
3. Ask in Slack + add the answer to docs later

---

## Team Adoption Plan

### Week 1: Announcement & Discovery

```
Monday:
📢 Post in Slack #general:
"Welcome to the new .agents/ documentation system! 
All project rules, procedures, and best practices are now documented in one place."

Check it out: .agents/README.md or .agents/

Optional: 15-min walkthrough on Thursday afternoon

Tuesday–Thursday:
Devs explore at their own pace
Bookmark sections relevant to their role
```

### Week 2: Training & Integration

```
Monday:
Training session (all hands):
- 10 min: What is .agents/ and why it exists
- 10 min: How to navigate (quick tour)
- 10 min: Q&A

Tuesday–Friday:
Start using in practice:
- Link to docs in PR reviews ("see .agents/code-conventions/")
- Reference docs in tickets
- Ask "did you check .agents/__?" when people ask common questions
```

### Week 3+: Ownership

```
Every week:
- Add new learnings to docs
- Update outdated sections
- Share useful tips in #engineering-docs

Monthly:
- Review for accuracy
- Gather feedback from team
- Make improvements
```

---

## Adoption Metrics

Track improvement:

```
Week 1:  ❓ "How do I write a commit message?"
         → Answer: Read .agents/code-conventions/commit-messages.md (self-service)

Week 2:  ✅ Developer reads it self
         → Next time, provides link to teammate

Week 3:  📚 Referred in 5+ PR reviews
         → Team self-sufficient, doc is working

Month 2: 🚀 Devs add improvements to .agents/
         → Ownership, continuous improvement phase
```

---

## Quick Reference: By Role

### 👨‍💻 Developer (New Feature)

```
Day 1:
.agents/README.md (5 min)
.agents/core-rules/principles.md (5 min)

Before first PR:
.agents/pr-workflow/checklist.md (10 min)
.agents/code-conventions/commit-messages.md (5 min)
.agents/code-conventions/linting-testing.md (5 min)

Your app's guide:
.agents/apps/[admin|api-core|cli-tool|storefront]/README.md (5 min)

Total: ~35 minutes
```

### 🚀 DevOps / Deployer

```
Day 1:
.agents/README.md (5 min)
.agents/infrastructure/environments.md (10 min)

Before first deployment:
.agents/infrastructure/deployment-procedure.md (15 min)
.agents/infrastructure/manifests.md (10 min)
.agents/high-risk-ops/approval-workflow-standard.md (5 min)

Total: ~45 minutes
```

### 🚨 On-Call Engineer

```
Day 1:
.agents/README.md (5 min)
.agents/escalation/support-levels.md (10 min)
.agents/escalation/on-call-procedures.md (15 min)

Before first shift:
.agents/troubleshooting/ (skim, 10 min)
.agents/infrastructure/rollback.md (10 min)

Total: ~50 minutes
```

---

## Resources

- **Main entry point**: [.agents/README.md](README.md)
- **For Copilot/AI agents**: [.agents/agents/](agents/)
- **Feedback/Questions**: Slack #engineering-docs
- **Report issues**: GitHub issues in [tvgx/multi-e-commerce](https://github.com/tvgx/multi-e-commerce)

---

**Questions?** Ask in #engineering-docs or create a GitHub issue.

Welcome aboard! 🚀
