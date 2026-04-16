# 🧪 Linting & Testing

Enforce code quality through automated checks and tests.

---

## Linting

### TypeScript/JavaScript (ESLint + Prettier)

```bash
# Check for issues
npm run lint

# Auto-fix (if possible)
npm run lint --fix

# Format code
npx prettier --write src/

# CI: lint check (must pass)
npm run lint  # Fails if violations found
```

**Config**: Each app has `eslint.config.mjs` in its root.

**Rules enforced**:
- No unused variables
- Consistent naming (camelCase)
- No console.log in production code
- No `any` types (use `unknown` instead)
- No `==`, use `===`

**What fails merge?**
- ESLint errors (not warnings)
- Any lint rule marked as `error` in config

### Python (Flake8 + Black)

```bash
# Check style
flake8 src/ tests/

# Auto-format
black src/ tests/

# Line length (default: 88)
black --line-length=100 src/
```

**Config**: `setup.cfg` or `pyproject.toml`

**Rules enforced**:
- Max 100 chars per line
- 2 blank lines between functions
- No unused imports
- Type hints required (modern Python)

### YAML (yamllint)

```bash
yamllint k8s/
```

**Rules**:
- 2-space indent (not tabs)
- No trailing whitespace
- Proper YAML syntax

---

## Testing

### TypeScript/JavaScript (Jest)

```bash
# Run all tests
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:cov
```

**Test file locations**:
- `src/**/__tests__/*.test.ts` or
- `src/**/*.test.ts`

**Example test**:
```typescript
describe('ProductService', () => {
  it('should return paginated products', () => {
    const result = productService.paginate({ limit: 10 });
    expect(result.items).toHaveLength(10);
    expect(result.nextCursor).toBeDefined();
  });

  it('should handle empty result', () => {
    const result = productService.paginate({ limit: 10, offset: 1000 });
    expect(result.items).toHaveLength(0);
  });
});
```

### Python (Pytest)

```bash
# Run all tests
pytest

# Verbose output
pytest -v

# Coverage
pytest --cov=src tests/

# Specific test file
pytest tests/test_shop_commands.py
```

**Test file naming**: `test_*.py` or `*_test.py`

**Example test**:
```python
def test_shop_create():
    """Test shop creation with valid params."""
    result = shop_service.create(
        name="Test Shop",
        domain="test.example.com"
    )
    assert result.id is not None
    assert result.status == "active"

def test_shop_create_missing_name():
    """Test shop creation validation."""
    with pytest.raises(ValidationError):
        shop_service.create(name="", domain="test.example.com")
```

---

## CI/CD Integration

All PRs run linting + testing automatically:

1. **Push branch** → `git push origin feature/my-feature`
2. **Create PR** → GitHub Actions trigger
3. **CI runs**:
   - `npm run lint` (must pass)
   - `npm run test` (must pass)
   - Coverage check (≥ 70% or target)
4. **Results on PR**:
   - ✅ All checks passed (green checkmark)
   - ❌ Some checks failed (red X, see logs)
5. **Merge only if all pass**

### What Prevents Merge?

- ❌ Lint errors
- ❌ Test failures
- ❌ Coverage drop (if enforced)
- ❌ Type errors (TypeScript)

### What Doesn't Block Merge?

- ⚠️ Lint warnings (if not promoted to errors)
- 📝 Comments from Copilot (informational)

---

## Coverage Requirements

| Path | Min Coverage | Why |
|---|---|---|
| `src/services/` | 80% | Core business logic |
| `src/api/routes/` | 70% | API endpoints |
| `src/utils/` | 70% | Utilities |
| `src/components/` | 50% | UI (happy path) |
| `src/pages/` | 0% | Typically not unit tested |
| `k8s/`, `docker/` | 0% | Infrastructure |

---

## Test-Driven Development (TDD)

Recommended workflow:

1. **Write test first** (failing)
   ```typescript
   test('should add two numbers', () => {
     expect(add(2, 3)).toBe(5);  // This fails (function doesn't exist)
   });
   ```

2. **Implement feature** (make test pass)
   ```typescript
   function add(a: number, b: number): number {
     return a + b;
   }
   ```

3. **Refactor** (keep tests passing)
   ```typescript
   const add = (a: number, b: number) => a + b;
   ```

---

## Best Practices

1. **Test behavior, not implementation**
   - ✅ "Product should have pagination"
   - ❌ "productService.paginate() should call db.query()"

2. **Mock external dependencies** (API, DB)
   ```typescript
   jest.mock('@/lib/db');
   const mockDb = db as jest.Mocked<typeof db>;
   mockDb.query.mockResolvedValue([]);
   ```

3. **Use descriptive test names**
   - ✅ `should return paginated products when limit provided`
   - ❌ `test1`, `works`, `check`

4. **Keep tests focused** (one assertion per test, or related assertions)

5. **Test both happy path & error cases**

---

## Running Tests Locally

```bash
# Fast check (watch mode)
npm run test:watch

# Full run before push
npm run lint && npm run test

# Coverage check
npm run test:cov
# Look for lines not covered (red) in report
```

---

## See Also

- [typescript-styles.md](typescript-styles.md) — type hints & patterns
- [python-styles.md](python-styles.md) — docstrings & patterns
- [../pr-workflow/checklist.md](../pr-workflow/checklist.md) — tests required before PR
