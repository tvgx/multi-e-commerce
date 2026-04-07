# 🔐 Security — Access Control & RBAC

Role-based permissions, API key management, and audit trails.

---

## Role Hierarchy

```
Platform Admin (Full Access)
    ↓
Ops Admin (All shops, limited delete)
    ↓
Shop Admin (Own shop only)
    ↓
Developer (Dev/acceptance, limited ops)
    ↓
CI/CD Service Account (Read-only + deploy)
```

---

## Permission Matrix

### By Operation

| Operation | Dev | Shop Admin | Ops Admin | Platform Admin |
|-----------|-----|-----------|-----------|--------------|
| **shop.list** (all) | ❌ | ❌ | ✅ | ✅ |
| **shop.list** (own) | ✅ | ✅ | ✅ | ✅ |
| **shop.create** | ❌ | ❌ | ✅ | ✅ |
| **shop.delete** | ❌ | ❌ | ❌ | ✅ |
| **product.create** | ❌ | ✅ | ✅ | ✅ |
| **backup.restore** | ❌ | ✅ (own) | ✅ | ✅ |
| **batch.execute** | ❌ | ❌ | ✅ | ✅ |
| **config.sync** | ❌ | ❌ | ✅ | ✅ |
| **audit.view** | ❌ | ✅ (own) | ✅ | ✅ |

---

## API Key Format & Scoping

### Key Structure

```
<role>-<environment>-<tenant>-<random>

Examples:
- dev-development-personal-abc123
- shop-staging-shop456-def789
- admin-ops-staging-ghi012
- admin-platform-production-jkl345
```

### Key Restrictions

**Developer Keys** (`dev-*`):
```
curl -H "Authorization: Bearer dev-development-personal-abc123" \
  http://localhost:3000/api/v1/shops
  
# Only returns developer's personal shops
# Cannot delete or modify production
```

**Shop Admin Keys** (`shop-<shop-id>`):
```
# Limited to single shop
curl -H "Authorization: Bearer shop-staging-shop456-def789" \
  http://localhost:3000/api/v1/products?shop_id=shop456

# Query param shop_id ignored (always scoped to key's shop)
# Returns same result regardless of ?shop_id param
```

---

## Creating & Managing API Keys

### Generate Developer Key (Self-Service)

```bash
# In app (Next.js, NestJS):
POST /auth/api-keys
{
  "name": "Local Development",
  "environment": "development",
  "scopes": ["shops:read", "products:read"]
}

# Response:
{
  "id": "key-123",
  "key": "dev-development-personal-abc123",
  "created_at": "2026-04-07T10:00:00Z",
  "expires_at": "2026-05-07T10:00:00Z"  # 30-day default
}
```

### Generate Shop Admin Key (Manual)

1. Admin logs in to dashboard
2. Settings → API Keys → Create
3. Select "Shop Admin" role
4. Pick scopes: products, orders, analytics, layouts
5. Key generated, display once, download as .txt

### Generate Ops Admin Key (Manual, Requires Approval)

1. Ops team member opens ticket
2. Request: scope (products/orders/all), environment (staging/prod)
3. Platform admin approves
4. Key generated, stored in Azure, rotation scheduled (monthly)

---

## Scoping Rules

### Multi-Tenant Query Filtering

Even with Ops Admin key, cannot see cross-tenant data without filtering:

```javascript
// Request from ops admin with key admin-ops-staging-xxx
GET /api/v1/orders

// Returns:
{
  "data": [
    { "id": "ord-1", "shop_id": "shop-1", "customer": "..." },
    { "id": "ord-2", "shop_id": "shop-2", "customer": "..." }
  ]
}

// Limited to 1000 results per page (forced pagination)
// Can't do raw SQL or bypass middleware
```

### Shop Admin Key Isolation

```javascript
// Request from shop admin with key shop-staging-shop456-xxx
GET /api/v1/shops/shop456/orders

// Works ✅
// Response limited to shop-456 orders

GET /api/v1/shops/shop789/orders

// Error 403 Forbidden ❌
// Key only has access to shop-456
```

---

## TenantInterceptor (Code Level)

Enforces scoping at middleware layer:

```typescript
// api-core/src/common/interceptor/tenant.interceptor.ts

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    
    // Extract shop_id from header or URL param
    const shopId = request.headers['x-shop-id'] || 
                   request.params.shop_id;
    
    // Store in AsyncLocalStorage (request-scoped)
    this.tenantService.setTenant(shopId);
    
    return next.handle().pipe(
      tap(() => this.tenantService.clear())
    );
  }
}

// All database queries auto-scoped:
const orders = await db.orders.findMany({
  where: {
    shop_id: getCurrentTenantId()  // Auto-added by middleware
  }
});
```

---

## Audit Trail

Every action logged with context:

```json
{
  "timestamp": "2026-04-07T10:30:00Z",
  "action": "product.create",
  "actor": {
    "id": "user-123",
    "role": "admin",
    "api_key_id": "key-456"
  },
  "resource": {
    "shop_id": "shop-789",
    "product_id": "prod-999",
    "changes": {
      "name": "New Product",
      "price": 29.99
    }
  },
  "result": "success",
  "ip_address": "192.168.1.100"
}
```

### Querying Audit Trail

```bash
# Via CLI
python main.py audit view --shop shop-456 --from 2026-04-01 --to 2026-04-07

# Via API (Ops Admin only)
GET /api/v1/audit?action=product.delete&shop_id=shop-456&limit=100

# Export (Platform Admin)
GET /api/v1/audit/export?format=csv
```

---

## Revocation & Expiry

### Automatic Expiry

- **Developer keys**: 30 days
- **Shop admin keys**: 90 days
- **Ops/platform keys**: 30 days (critical), 90 days (others)

**Upcoming expiry notification**:
```
5 days before expiry → Email alert
2 days before expiry → Dashboard warning
At expiry → Key disabled (403 Forbidden)
```

### Manual Revocation

```bash
# Via dashboard or API
DELETE /auth/api-keys/:key_id

# Immediate effect (cached for 5 min max)
# Audit log entry created
```

---

## Checklist: Setting Up Access for New Developer

- [ ] Create developer account in admin dashboard
- [ ] Verify email
- [ ] Generate personal development API key
- [ ] Add key to local `.env.local`
- [ ] Test: `curl -H "Authorization: Bearer <key>" http://localhost:3000/api/v1/shops`
- [ ] Explain scoping rules (can only see own/test shops)
- [ ] Show audit trail (can see own actions)
- [ ] Add to Slack channel (#engineering-dev)

---

See [README.md](README.md) for overview | [secret-management.md](secret-management.md)
