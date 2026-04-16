# 🏪 Shops API

Shop CRUD, configuration, and multi-tenant setup.

---

## Endpoints

### Create Shop

```http
POST /shops
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Fashion Hub",
  "domain": "fashionhub.com",
  "owner_email": "owner@fashionhub.com",
  "template_id": "fashion-template-v1"
}
```

**Response (201)**:
```json
{
  "id": "shop-123",
  "name": "Fashion Hub",
  "domain": "fashionhub.com",
  "owner_email": "owner@fashionhub.com",
  "status": "active",
  "created_at": "2026-04-07T10:00:00Z"
}
```

**Errors**:
- `400`: Domain already exists, invalid email, missing required fields
- `409`: Shop name conflict

---

### List Shops

```http
GET /shops?page=1&limit=20&sort=created_at:desc
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": "shop-123",
      "name": "Fashion Hub",
      "domain": "fashionhub.com",
      "status": "active",
      "created_at": "2026-04-07T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Query Params**:
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20, max: 100)
- `sort` (string): Sort field + direction (e.g., `created_at:desc`)
- `status` (string): Filter by status (active, inactive, suspended)

---

### Get Shop

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
