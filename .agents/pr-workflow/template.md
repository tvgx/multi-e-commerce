# 📋 PR Template

Copy this template into your PR description when opening.

---

## PR Title Format

```
<type>(<scope>): <short-description>

Examples:
- feat(api-core): add product pagination
- fix(admin): layout builder crash on large templates
- docs(README): add deployment instructions
```

---

## PR Description (Copy & Fill)

```markdown
## Description
Brief summary of what this PR does in 1–2 sentences.

Example:
\"Adds pagination support to the products API, allowing clients to request products
with limit/offset or cursor-based navigation.\"

## Problem / Context
Why is this change needed? What problem does it solve? Or: What's the user story?

Example:
\"Users retrieving large product lists were getting timeout errors. This PR adds
pagination to avoid loading all products in memory.\"

## Solution
How does this PR solve the problem? What approach was taken?

Example:
\"Implemented cursor-based pagination (more reliable for real-time data) and 
supports both limit/offset for backward compatibility. Added database indexes
on sort keys for performance.\"

## Related Issues
Link to GitHub issues or JIRA tickets.

Examples:
- Fixes #234
- Related to #100, #101
- Resolves tvgx/multi-e-commerce#50

## Changes
Bullet list of changes made.

- Added `GET /api/v1/products/paginated` endpoint
- Added `Pagination` type and utils
- Implemented cursor-based pagination logic
- Added integration tests (12 new test cases)
- Updated API docs & examples

## Testing
How was this tested? What tests were added?

- [ ] Unit tests added (coverage: 82%)
- [ ] Integration tests added (test with real DB)
- [ ] Manual testing done (tested in Postman)
- [ ] E2E tests updated (if UI affected)

Testing examples/commands:
```bash
curl http://localhost:3000/api/v1/products/paginated?limit=10
# Returns first 10 products + next_cursor

curl http://localhost:3000/api/v1/products/paginated?limit=10&cursor=abc123
# Returns next 10 products from cursor
```

## Deployment Notes
Any special considerations for deployment? Database migrations? Breaking changes?

- [ ] No database migrations required
- [ ] No breaking changes
- [ ] Requires environment variables: (list any)
- [ ] Rollback plan: (if complex deployment)

If migrations needed:
```sql
-- Migration: 010_add_product_pagination_index.sql
CREATE INDEX idx_products_created_on_id 
ON products (created_at DESC, id DESC);
```

Rollback:
```sql
DROP INDEX idx_products_created_on_id;
```

## Screenshots / Logs (if applicable)
Add before/after screenshots for UI changes, or logs showing behavior.

### Before
[Image or log]

### After
[Image or log]

## Checklist
- [ ] Tests passing (all green CI checks)
- [ ] Linting passing (`npm run lint` or `flake8`)
- [ ] Code coverage adequate (≥70% for new code)
- [ ] Documentation updated (README, API docs, comments)
- [ ] No secrets in code (grep for api_key, password, token)
- [ ] Commit messages follow Conventional Commits
- [ ] No merge commits (rebased on main if needed)
- [ ] Reviewed own code (self-review done)

## Reviewers
Tag the appropriate reviewers:
- @tech-lead (all PRs)
- @feature-owner (feature-specific)
- @sre (infrastructure changes)
- @dba (database schema changes)

## Additional Notes
Any other context for reviewers?

- Performance: This PR adds ~5ms latency to product list (due to index lookup) but eliminates timeouts.
- Compatibility: Backward compatible. Old clients using GET /api/v1/products still work.
- Future work: Consider implementing GraphQL cursor-based pagination in next phase.
```

---

## Minimal Template (For Small Fixes)

If your change is very small, use this minimal version:

```markdown
## What
Fix: product pagination cursor validation

## Why
Cursor was not validated, leading to 400 errors on invalid input.

## Tests
- [x] Unit test added
- [x] All CI checks pass

Fixes #234
```

---

## PRs to Avoid

❌ **TOO VAGUE:**
```markdown
## Description
Fix stuff

## Changes
- Updated code
- Fixed bugs
```

❌ **TOO MUCH:**
```markdown
## Description
[800 lines of explanation covering 12 different features and refactoring]

## Changes
- 50+ changed files
- 5000+ lines of diff
```

❌ **MISSING CRITICAL INFO:**
```markdown
## Description
Added database optimization

## Changes
- Added index
- Added migration

[No explanation, no testing details, no rollback plan]
```

---

## Tips

1. **Be specific**: Avoid vague language like \"fixed stuff\"
2. **Explain WHY**: Not just what changed, but why
3. **Show testing**: Include example commands or test output
4. **Plan for rollback**: If complex, explain how to revert
5. **Screenshot UI changes**: A picture is worth 1000 words
6. **Link to issues**: Makes tracking changes easier

---

**Next?** → [review-rules.md](review-rules.md) (how many reviewers needed, labels)
