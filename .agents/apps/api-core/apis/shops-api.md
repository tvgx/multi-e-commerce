# 🏪 Shops API

Shop creation, tenant registration, and multi-tenant management.

---

## Endpoints

### UC-01: Register Tenant (New Shop Onboarding)

**Endpoint**: `POST /api/v1/tenants/register`  
**Status**: Live (v2.0+)  
**Purpose**: Create a new shop with owner account

```http
POST /api/v1/tenants/register
Content-Type: application/json

{
  "shopName": "My Fashion Store",
  "email": "owner@fashionstore.com",
  "domain": "fashionstore",
  "ownerName": "Alice Smith"
}
```

**Success Response (201)**:
```json
{
  "code": "1000",
  "message": "OK",
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "shopName": "My Fashion Store",
    "domain": "fashionstore",
    "email": "owner@fashionstore.com",
    "ownerName": "Alice Smith",
    "status": "active",
    "createdAt": "2026-04-16T10:30:00Z"
  }
}
```

**Error Cases**:

| HTTP | Code | Scenario | Message |
|------|------|----------|---------|
| 400 | 1002 | Missing required field | `shopName, email, domain, or ownerName is required` |
| 400 | 1003 | Invalid email | `Invalid email format` |
| 400 | 1004 | Invalid domain | `Invalid domain format` |
| 409 | 1013 | Domain exists | `Domain already exists` |
| 409 | 9996 | Email registered | `Email already registered` |
| 500 | 9999 | Server error | `Exception occurred` |

**Notes**:
- Domain is DNS-safe (lowercase, 3-63 chars, alphanumeric + hyphens)
- Owner user is auto-created with role=OWNER
- Shop initialized with default master template
- Default navigation menus created (main-menu, footer-menu)
- MongoDB ShopTemplate initialized in zero-file layout engine

---

### Create Shop (Legacy)

**Endpoint**: `POST /api/shops`  
**Status**: Deprecated (use `/api/v1/tenants/register`)  
**Purpose**: Create shop (backward compatibility)

```http
GET /shops/:id
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "shop-123",
  "name": "Fashion Hub",
  "domain": "fashionhub.com",
  "owner_email": "owner@fashionhub.com",
  "status": "active",
  "template_id": "fashion-template-v1",
  "settings": {
    "currency": "USD",
    "timezone": "America/New_York",
    "language": "en"
  },
  "created_at": "2026-04-07T10:00:00Z",
  "updated_at": "2026-04-07T12:30:00Z"
}
```

**Errors**:
- `404`: Shop not found
- `403`: Access denied

---

### Update Shop

```http
PATCH /shops/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Fashion Hub Pro",
  "settings": {
    "currency": "EUR",
    "timezone": "Europe/London"
  }
}
```

**Response (200)**:
```json
{
  "id": "shop-123",
  "name": "Fashion Hub Pro",
  "domain": "fashionhub.com",
  "settings": {
    "currency": "EUR",
    "timezone": "Europe/London"
  },
  "updated_at": "2026-04-07T12:30:00Z"
}
```

---

### Delete Shop

```http
DELETE /shops/:id
Authorization: Bearer <token>
```

**Response (204)**: No content

**Notes**:
- Only Platform Admin can delete shops
- Triggers automatic backup before deletion
- Cannot undo (use backup restore if needed)

---

### Get Shop Health

```http
GET /shops/:id/health
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "shop-123",
  "status": "healthy",
  "checks": {
    "api": "ok",
    "database": "ok",
    "storage": "ok",
    "cdn": "ok"
  },
  "last_check": "2026-04-07T12:30:00Z"
}
```

---

### Enable/Disable Shop

```http
PATCH /shops/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "inactive"
}
```

**Allowed statuses**: `active`, `inactive`, `suspended` (suspended = payment issue)

---

### Get Shop Stats

```http
GET /shops/:id/stats?from=2026-03-01&to=2026-04-07
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "shop_id": "shop-123",
  "period": {
    "from": "2026-03-01",
    "to": "2026-04-07"
  },
  "metrics": {
    "total_orders": 342,
    "total_revenue": 15420.50,
    "avg_order_value": 45.08,
    "conversion_rate": 0.032,
    "unique_customers": 198
  }
}
```

---

## Authentication & Scoping

**Multi-tenancy**: All endpoints auto-scoped to current user's shop.

- **Developer**: Can list personal shops only
- **Shop Admin**: Can only access own shop
- **Ops Admin**: Can access all shops
- **Platform Admin**: Can access all shops + delete

---

See [../README.md](../README.md) for base URL, auth, pagination
