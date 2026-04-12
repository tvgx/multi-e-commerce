# 📢 Team Announcement Template

Use this template to announce the new `.agents/` documentation system to your team.

---

## Slack Channel Post

```
🎉 Introducing `.agents/` — Your New Handbook

Hi team! We've just published a comprehensive documentation system that covers everything you need to know about our project:

✅ Code standards & PR workflow
✅ Deployment & infrastructure procedures  
✅ Database migrations & backups
✅ On-call & incident response
✅ Security, release process, and more

📖 **Start here**: .agents/README.md
⏱️ **Time commitment**: 20 min to get started (more if deploying/on-call)

**Why this exists**:
- Single source of truth (no conflicting docs)
- Faster onboarding for new devs
- Reduce mistakes by following tested procedures
- AI agents (Copilot) understand our rules

**How to use it**:
1. Read .agents/README.md
2. Jump to your role's section
3. Bookmark it
4. Use in day-to-day work

📚 We're hosting a **15-minute walkthrough this Thursday at 2 PM UTC** if you want a quick tour.

Questions? Drop them in #engineering-docs

Let's ship better, together! 🚀
```

---

## Email to Team

```
Subject: Welcome to `.agents/` — Your New Project Handbook

Hi Team,

I'm excited to share a new project documentation system we've built: `.agents/`

For months, we've been duplicating information across wikis, Slack threads, and individual docs. No more! We've consolidated everything into a single, searchable knowledge base.

THE BASICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Location: `/home/troll/workspaces/ecommerce-platform/.agents/`
📖 Start here: .agents/README.md
⏱️ Time to get started: 20 minutes

WHAT'S INSIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✍️  Code standards (commits, PRs, linting)
🏗️  Infrastructure & deployment procedures
💾 Database migrations, backups & disaster recovery
🚨 On-call procedures & incident response
🔐 Security, access control, secret management
📦 Release process & versioning
📱 Application guides (Admin, API Core, CLI Tool, Storefront)
🤖 Automation rules (CI/CD, Kubernetes jobs, Copilot)

BY ROLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍💻 Developer?     → Read: Code conventions + PR workflow (~20 min)
🚀 Deployer?      → Read: Infrastructure + deployment (~30 min)
🚨 On-call?       → Read: Escalation + troubleshooting (~25 min)
👤 New member?    → Read: .agents/README.md → Your role (~30 min)

WHAT CHANGES FOR YOU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ You now have ONE place to look up rules, not 5 different wikis
✓ Faster to answer your own questions (self-service)
✓ Easier to onboard new team members
✓ Better pair-programming (shared playbooks)
✓ AI-assisted development (Copilot understands our rules)

NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Read: .agents/README.md (5 minutes)
2️⃣  Find your role-specific section (depends on role)
3️⃣  Bookmark it
4️⃣  Use in your day-to-day work

OPTIONAL: WALKTHROUGH 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thursday 2 PM UTC — 15 minute guided tour
[Zoom link]

I'll walk through:
- Navigation & search
- How to find answers
- How to contribute

Questions? Ask in #engineering-docs

See you on the docs! 🚀

—[Engineering Lead]
```

---

## Slack Weekly Tip

Starting week 2, post one tip per week to keep `.agents/` top-of-mind:

```
💡 Weekly `.agents/` Tip:

Did you know? You can use Ctrl+F to search within markdown files.

Looking for "how to write a commit message"?
Open .agents/code-conventions/commit-messages.md and search.

Over time, you'll memorize where things are, but quick search gets you there instantly!

Pro tip: Bookmark sections you use often. 🔖
```

---

## FAQ for Team

### "Do I HAVE to read all of `.agents/`?"

No! Read based on your role. Most devs need:
- .agents/README.md (5 min)
- Your role section (15-30 min)
- Rest as needed

### "What if something in `.agents/` is wrong?"

Great catch! Create a PR or comment in #engineering-docs. We'll fix it.

### "Can I ignore `.agents/` and ask teammates?"

You can, but it's faster to read. Plus your teammates appreciate not being interrupted for the same questions.

### "What if `.agents/` doesn't have what I need?"

1. Check README (might be under different name)
2. Use Ctrl+F to search
3. Ask in #engineering-docs and we'll add it

### "How do I update `.agents/`?"

Create PR:
```bash
git checkout -b fix/agents-update-db-migration-docs
# Edit file
git commit -m "docs: Update database migration examples"
git push origin fix/agents-update-db-migration-docs
```

---

## Rollout Schedule (Week-by-Week)

### Week 1: Announcement

```
Monday: Post in #general (announcement above)
Tuesday: Optional Slack walkthrough Q&A
Wednesday: Send email to team
Thursday: Optional Zoom walkthrough (15 min)
Friday: Collect initial feedback
```

### Week 2: Integration

```
Start referencing in PR reviews: 
"See .agents/code-conventions/commit-messages.md"

Start using in ticket descriptions:
"Follow .agents/infrastructure/deployment-procedure.md"
```

### Week 3: Gamification (Optional)

```
"Spot a missing doc? First person to submit a PR gets +1 DevOps points"

Motivate team contributions to keep `.agents/` fresh.
```

---

## Success Metrics

Track adoption & health:

```
Week 1:
- Read count (use GitHub file views if tracked)
- Slack questions about docs (should increase)

Week 2:
- Number of references in PRs (target: 5+)
- Number of view on .agents/README.md

Week 4:
- Self-service questions answered by docs
- Team members citing docs in code reviews
- New contributions to docs

Month 2:
- Reduced "how do I...?" questions in Slack
- Faster onboarding of new team members
- Team ownership (volunteers updating docs)
```

---

## Feedback Survey (Optional)

After 2 weeks, ask team:

```
📋 Quick Survey: `.agents/` Documentation

1. Have you used `.agents/` yet? (Yes / No)
2. Are docs clear and easy to follow? (1-5)
3. Is `.agents/` organized well? (1-5)
4. Missing any documentation? (Free text)
5. Any suggestions? (Free text)

Slack poll or Google Form link
```

---

Use these templates to roll out `.agents/` to your team successfully! 🚀
