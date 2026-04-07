# 📊 Analytics API

Shop metrics, revenue, customers, and reporting.

---

## Endpoints

### Get Shop Summary

```http
GET /analytics/shops/:shop_id/summary?from=2026-03-01&to=2026-04-07
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
    "total_refunded": 850.00,
    "net_revenue": 14570.50,
    "avg_order_value": 45.08,
    "unique_customers": 198,
    "return_customer_rate": 0.23,
    "conversion_rate": 0.032,
    "cart_abandonment_rate": 0.68
  }
}
```

---

### Get Daily Metrics

```http
GET /analytics/shops/:shop_id/daily?from=2026-03-01&to=2026-04-07
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "shop_id": "shop-123",
  "data": [
    {
      "date": "2026-03-01",
      "orders": 12,
      "revenue": 580.50,
      "customers": 11,
      "page_views": 3200,
      "conversion_rate": 0.0375
    },
    {
      "date": "2026-03-02",
      "orders": 15,
      "revenue": 720.75,
      "customers": 14,
      "page_views": 3850,
      "conversion_rate": 0.039
    }
  ]
}
```

---

### Get Product Performance

```http
GET /analytics/shops/:shop_id/products?limit=20&sort=revenue:desc
Authorization: Bearer <token>
```

**Response (200)**:
```json
[
  {
    "product_id": "prod-456",
    "name": "Vintage T-Shirt",
    "sku": "TSH-001",
    "units_sold": 45,
    "revenue": 1349.55,
    "avg_rating": 4.8,
    "page_views": 320,
    "conversion_rate": 0.141
  }
]
```

**Query Params**:
- `sort` (string): `revenue:desc`, `units_sold:desc`, `conversion_rate:desc`
- `limit` (int): Top N products

---

### Get Customer Cohorts

Analyze customer acquisition and lifetime value:

```http
GET /analytics/shops/:shop_id/cohorts?from=2026-01-01&to=2026-04-07
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "shop_id": "shop-123",
  "cohorts": [
    {
      "cohort_month": "2026-01",
      "cohort_size": 45,
      "retention_week_1": 0.78,
      "retention_week_4": 0.42,
      "avg_ltv": 245.30,
      "total_revenue": 11038.50
    }
  ]
}
```

---

### Get Traffic Source Analysis

```http
GET /analytics/shops/:shop_id/traffic?from=2026-03-01&to=2026-04-07
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "shop_id": "shop-123",
  "sources": [
    {
      "source": "organic",
      "sessions": 1250,
      "users": 890,
      "revenue": 4250.00,
      "conversion_rate": 0.042
    },
    {
      "source": "paid_ads",
      "sessions": 980,
      "users": 620,
      "revenue": 5130.00,
      "conversion_rate": 0.062
    },
    {
      "source": "social",
      "sessions": 420,
      "users": 310,
      "revenue": 1890.00,
      "conversion_rate": 0.028
    }
  ]
}
```

**Source Types**: `organic`, `paid_ads`, `social`, `email`, `direct`, `referral`

---

### Get Platform Summary (Multi-Tenant)

Only accessible to Platform Admin & Ops Admin:

```http
GET /analytics/platform/summary?from=2026-03-01&to=2026-04-07
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "period": {
    "from": "2026-03-01",
    "to": "2026-04-07"
  },
  "shops_count": 1240,
  "active_shops": 980,
  "metrics": {
    "total_revenue": 2850000.00,
    "avg_shop_revenue": 2306.12,
    "total_orders": 62400,
    "avg_order_value": 45.67,
    "total_customers": 28500,
    "avg_customers_per_shop": 23
  },
  "top_shops": [
    {
      "shop_id": "shop-123",
      "name": "Fashion Hub",
      "revenue": 45200.00,
      "orders": 892
    }
  ]
}
```

---

## Data Retention

- **Real-time data**: Last 7 days (updated hourly)
- **Aggregated data**: Last 2 years (daily snapshots)
- **Events**: Last 1 year (immutable audit log)

---

## Export

All endpoints support `?format=csv` or `?format=json` query param for file export.

---

See [../README.md](../README.md) for base URL, auth, pagination
