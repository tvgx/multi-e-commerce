# 🤖 Agents — Copilot & AI Assistant Guidelines

Rules for AI agents, Copilot interactions, and automated suggestions.

---

## When to Invoke Copilot

Copilot (GitHub's AI assistant) can help with:

✅ **Good use cases**:
- Explain existing code
- Generate unit test cases
- Suggest refactoring patterns
- Write documentation
- Explain error messages
- Suggest performance optimizations

⚠️ **Caution required**:
- Security-sensitive code (review extra carefully)
- Database migrations (always test first)
- High-risk operations (never trust without review)

❌ **Never use for**:
- Generating secrets/API keys
- Creating authentication logic from scratch
- Bypass confirmation prompts
- Approve high-risk operations without human review

---

## Copilot Suggestions in Code

### Code Generation Requests

When asking Copilot to generate code:

```typescript
// ✅ GOOD: Specific context
// Generate a React hook for managing shop cart
// - State: items (array), total (number)
// - Methods: addItem, removeItem, updateQuantity
// - Persist to localStorage with debounce

// Response will use correct patterns, error handling, TypeScript

// ❌ BAD: Too vague
// Generate code for shopping cart
```

### Security Considerations

**Never ask Copilot**:
```
// ❌ WRONG
// Generate JWT token with secret "my-secret-key"
// Generate database password

// ✅ CORRECT (if you need help conceptually)
// Explain JWT token generation best practices
// How should we store database passwords securely?
```

---

## AI-Assisted Code Review

When Copilot comments on PRs:

### Types of Feedback

**Always review**:
- Security suggestions (verify they're correct)
- Performance optimizations (benchmark before applying)
- Error handling improvements (ensure complete)

**Usually safe**:
- Code style suggestions (check against AGENTS.md)
- Documentation improvements (review for accuracy)
- Test coverage recommendations (verify coverage % is correct)

### Example Copilot Review Comment

```
Copilot suggestion:
"This function could be optimized by memoizing results.
Consider using useMemo() for expensive computations."

Review steps:
1. Is this actually expensive? ✓ Yes, involves DB query
2. Is useMemo appropriate here? ✓ Yes, Pure function
3. Will it cause memory issues? ✗ No, caches < 10 items
4. Action: Accept & apply
```

---

## Automated Suggestions in Workflows

### CLI Tool Suggestions

When Copilot suggests CLI commands:

```bash
# ❌ WRONG - Don't accept without understanding
copilot: "Run: python main.py shop delete --all"
user: *nervously copies command*

# ✅ RIGHT - Ask for clarification
copilot: "Run: python main.py shop delete --all"
user: "Does this delete all shops? What about backups?"
copilot: "Yes, all shops. A backup is created first."
user: *reviews AGENTS.md for approval process*
user: "Got it, but per AGENTS.md this requires 2-person approval"
```

### Database Operations

```python
# ❌ WRONG - Copilot suggests, auto-applies
copilot: "Run migration: ALTER TABLE products DROP COLUMN legacy_id"
job.run_migration()  # Immediately executes

# ✅ RIGHT - Manual approval gate
copilot: "Suggested migration: ALTER TABLE products DROP COLUMN legacy_id"
# 1. Create PR with migration
# 2. Review migration impact
# 3. Plan maintenance window
# 4. Run in staging first
# 5. Get approval
# 6. Execute in production
```

---

## Configuration

### Enable/Disable Copilot

**For entire repo** (Settings → Copilot):
```
☑ Copilot enabled in PRs
☑ Copilot enabled in code
☑ Copilot enabled in docs
☑ Copilot enabled in CLI (future)
```

**For specific files**:
```
# .github/copilot/rules.md
---
scope:
  - path: 'apps/api-core/src/auth/**'
    rule: 'strict'  # Extra scrutiny
  - path: 'apps/storefront/components/**'
    rule: 'normal'
  - path: 'apps/cli-tool/commands/delete.py'
    rule: 'disabled'  # Never auto-suggest for destructive ops
---
```

---

## Best Practices

### When Working with Copilot

1. **Provide context first**
   ```
   // Instead of: "Write a function"
   // Try: "Write a function to validate shop domain names.
   // Requirements: No special chars, min 3 chars, max 50 chars.
   // Return: boolean or error message"
   ```

2. **Always review generated code**
   - Read every line
   - Check error handling
   - Verify security
   - Run tests

3. **Treat it as first draft, not final code**
   ```
   Copilot output → Code style fixes → Testing → Review → Merge
   ```

4. **Ask follow-up questions**
   ```
   You: "Why did you use async/await instead of Promise.then()?"
   Copilot: "Async/await is more readable and easier to error-handle"
   You: "Good point, but can we add error boundary? Show me."
   Copilot: [improved version]
   ```

---

## Common Patterns Copilot Excels At

### API Endpoint Handlers

```typescript
// Copilot can generate:
- Full CRUD controllers
- Error handling with proper status codes
- Input validation
- Database queries
- Response formatting

// But always review: Security, SQL injection, N+1 queries
```

### React Components

```typescript
// Copilot can generate:
- Functional components with hooks
- Event handlers
- Conditional rendering
- Form handling with validation

// But always review: Accessibility, performance, state management
```

### Shell Scripts

```bash
# Copilot can generate:
- Bash loops & conditionals
- File operations
- Error checking

# But NEVER let Copilot generate:
- Destructive operations (rm -rf)
- Unreviewed secrets config
- Unvetted security commands
```

---

## Red Flags

🚩 Stop and review if Copilot suggests:

1. **Skipping validation**
   ```typescript
   // ❌ Skip this
   const password = req.body.password;  // No validation
   ```

2. **Hardcoded secrets**
   ```python
   # ❌ Never do this
   api_key = "sk_live_1234567890"
   ```

3. **Unprotected database writes**
   ```sql
   -- ❌ No WHERE clause = danger
   UPDATE products SET price = 99;
   ```

4. **Bypassing approval workflows**
   ```bash
   # ❌ Don't force-bypass
   git push --force origin main
   ```

---

## Training Copilot

Over time with feedback, Copilot learns your preferences:

```
You keep accepting certain pattern → Copilot suggests similar
You keep rejecting certain approach → Copilot avoids it

Helpful feedback:
"I like that you suggested using error boundaries"
"Remember, we use Tailwind, not inline styles"
"Can you explain your approach before suggesting code?"
```

---

See [README.md](README.md) for overview | [automation-rules.md](automation-rules.md) | [ci-cd-rules.md](ci-cd-rules.md)
