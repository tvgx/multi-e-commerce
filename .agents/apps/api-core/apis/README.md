# 🔌 API Core — Endpoints Overview

Complete OpenAPI documentation organized by module.

---

## Modules

| Module | Purpose | Endpoints | Auth |
|--------|---------|-----------|------|
| [shops](shops-api.md) | Shop management, CRUD | 8 endpoints | Shop Owner, Admin |
| [products](products-api.md) | Products, variants, inventory | 12 endpoints | Shop Owner, Admin |
| [orders](orders-api.md) | Orders, fulfillment, payments | 10 endpoints | Shop Owner, Admin, Customer |
| [layouts](layouts-api.md) | Layout builder, publish, compile | 7 endpoints | Shop Owner, Admin |
| [analytics](analytics-api.md) | Shop stats, metrics, reports | 6 endpoints | Shop Owner, Admin |

---

## Base URL

```
Development:  http://localhost:3000/api/v1
Staging:      https://api-staging.example.com/api/v1
Production:   https://api.example.com/api/v1
```

---

## Authentication

All endpoints require **JWT Bearer token**:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/shops
```

---

## Error Responses

Standard error format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Rate Limiting

- **Dev**: Unlimited
- **Staging**: 1000 req/min per user
- **Production**: 100 req/min per user (burst: 500/min)

---

## Pagination

Query params for list endpoints:

```
?page=1&limit=20&sort=createdAt:desc
```

---

**Select module above for detailed endpoints**
