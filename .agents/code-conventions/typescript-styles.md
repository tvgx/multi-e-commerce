# 📘 TypeScript Best Practices

Guidelines for TypeScript code in Next.js, NestJS, and shared libraries.

---

## Core Rules

### 1. Strict Mode Always

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. No `any` Type

❌ Bad:
```typescript
function processData(data: any) {
  return data.toString();  // Could crash if data is null
}
```

✅ Good:
```typescript
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data;
  }
  throw new Error('Expected string');
}
```

### 3. Type Everything

❌ Bad:
```typescript
const getUserId = (user) => user.id;
```

✅ Good:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const getUserId = (user: User): string => user.id;
```

### 4. Use const by Default

```typescript
// ✅ Prefer const
const name = 'Alice';
const count = 10;

// Use let only when variable reassigns
let total = 0;
for (const item of items) {
  total += item.price;
}

// Never use var (legacy)
```

### 5. Async/Await > Promises > Callbacks

```typescript
// ✅ Async/await
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data as User;
}

// 🟡 Promises (if async not available)
function fetchUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then(r => r.json())
    .then(data => data as User);
}

// ❌ Callbacks
function fetchUser(id: string, callback: (err: Error | null, user?: User) => void) {
  fetch(`/api/users/${id}`) // Hard to read, error handling complex
    .then(...)
    .catch(...)
}
```

### 6. Generics for Reusable Code

```typescript
// ✅ Generic function
function getById<T extends { id: string }>(items: T[], id: string): T | null {
  return items.find(item => item.id === id) ?? null;
}

// Usage:
const user = getById<User>(users, 'user-123');
const product = getById<Product>(products, 'prod-456');
```

---

## Error Handling

### Always Handle Errors

```typescript
// ❌ Ignored promise rejection
async function saveUser(user: User) {
  db.insert(user);  // What if this fails?
}

// ✅ Proper error handling
async function saveUser(user: User): Promise<Result<User, Error>> {
  try {
    const result = await db.insert(user);
    return { ok: true, data: result };
  } catch (error) {
    console.error('Failed to save user:', error);
    return { ok: false, error };
  }
}
```

### Type Custom Errors

```typescript
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

try {
  // ...
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Invalid field: ${error.field}`);
  }
}
```

---

## Naming Conventions

- **Files**: kebab-case (`user-service.ts`, `product-repository.ts`)
- **Classes**: PascalCase (`UserService`, `ProductRepository`)
- **Functions/Variables**: camelCase (`getUserById`, `totalPrice`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_BASE_URL`)
- **Interfaces**: PascalCase (`User`, `Product`, `ApiResponse`)
- **Enums**: PascalCase (`Status`, `Environment`)

---

## Code Structure Example

```typescript
// user-service.ts
interface User {
  id: string;
  name: string;
  email: string;
}

export class UserService {
  constructor(private db: Database) {}

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await this.db.users.findOne({ id });
      return user || null;
    } catch (error) {
      this.logger.error('Failed to fetch user:', error);
      throw new Error('Database error');
    }
  }

  async createUser(data: CreateUserInput): Promise<User> {
    this.validateEmail(data.email);
    const user = await this.db.users.insert(data);
    return user;
  }

  private validateEmail(email: string): void {
    if (!email.includes('@')) {
      throw new ValidationError('email', 'Invalid email format');
    }
  }
}
```

---

## React Component Patterns

### Functional Components with Hooks

```typescript
interface Props {
  userId: string;
  onUserLoad: (user: User) => void;
}

export const UserProfile: React.FC<Props> = ({ userId, onUserLoad }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await api.getUser(userId);
        setUser(data);
        onUserLoad(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, onUserLoad]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>No user found</div>;

  return <div>{user.name} ({user.email})</div>;
};
```

### Props Interface Pattern

```typescript
interface BaseProps {
  className?: string;
  id?: string;
}

interface ButtonProps extends BaseProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  disabled = false,
  variant = 'primary',
  ...rest
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      {...rest}
    >
      {children}
    </button>
  );
};
```

---

## Testing Patterns

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = {
      users: {
        findOne: jest.fn(),
        insert: jest.fn(),
      },
    } as any;
    service = new UserService(mockDb);
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockDb.users.findOne.mockResolvedValue({
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
      });

      const user = await service.getUserById('1');
      expect(user?.name).toBe('Alice');
      expect(mockDb.users.findOne).toHaveBeenCalledWith({ id: '1' });
    });

    it('should return null when not found', async () => {
      mockDb.users.findOne.mockResolvedValue(null);
      const user = await service.getUserById('999');
      expect(user).toBeNull();
    });

    it('should throw on database error', async () => {
      mockDb.users.findOne.mockRejectedValue(new Error('DB error'));
      await expect(service.getUserById('1')).rejects.toThrow('Database error');
    });
  });
});
```

---

## See Also

- [linting-testing.md](linting-testing.md) — ESLint rules, testing
- [commit-messages.md](commit-messages.md) — type hints in commit scope
- [../pr-workflow/](../pr-workflow/) — code review guidelines
