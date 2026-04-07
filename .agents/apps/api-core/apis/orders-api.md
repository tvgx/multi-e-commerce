# 📋 Orders API

Order creation, fulfillment, payments, and tracking.

---

## Endpoints

### Create Order

```http
POST /orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1-555-0123"
  },
  "items": [
    {
      "product_id": "prod-456",
      "sku_id": "sku-001",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "payment_method": "credit_card",
  "notes": "Gift wrap please"
}
```

**Response (201)**:
```json
{
  "id": "ord-123",
  "order_number": "#ORD-001234",
  "shop_id": "shop-123",
  "customer_email": "customer@example.com",
  "status": "pending",
  "total_amount": 59.98,
  "currency": "USD",
  "created_at": "2026-04-07T10:00:00Z"
}
```

**Errors**:
- `400`: Invalid data, insufficient inventory
- `402`: Payment required
- `409`: Duplicate order

---

### List Orders

```http
GET /orders?page=1&limit=20&status=completed&from=2026-03-01&to=2026-04-07
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": "ord-123",
      "order_number": "#ORD-001234",
      "customer_email": "customer@example.com",
      "status": "completed",
      "total_amount": 59.98,
      "created_at": "2026-04-07T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 342 }
}
```

**Query Params**:
- `status` (string): `pending`, `processing`, `shipped`, `completed`, `cancelled`
- `from` (date): Start date (YYYY-MM-DD)
- `to` (date): End date (YYYY-MM-DD)
- `customer_email` (string): Filter by email

---

### Get Order

```http
GET /orders/:id
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "ord-123",
  "order_number": "#ORD-001234",
  "shop_id": "shop-123",
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1-555-0123"
  },
  "items": [
    {
      "product_id": "prod-456",
      "product_name": "Vintage T-Shirt",
      "sku_id": "sku-001",
      "quantity": 2,
      "price": 29.99,
      "subtotal": 59.98
    }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "postal_code": "10001"
  },
  "status": "processing",
  "total_amount": 59.98,
  "payment_status": "paid",
  "shipping_status": "not_shipped",
  "created_at": "2026-04-07T10:00:00Z",
  "updated_at": "2026-04-07T12:30:00Z"
}
```

---

### Update Order Status

```http
PATCH /orders/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "processing",
  "notes": "Picked and ready to ship"
}
```

**Valid statuses**: `pending`, `processing`, `shipped`, `completed`, `cancelled`

**Response (200)**: Updated order object

---

### Create Shipment

```http
POST /orders/:id/shipments
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [
    {
      "product_id": "prod-456",
      "quantity": 2
    }
  ],
  "carrier": "fedex",
  "tracking_number": "7642847264826"
}
```

**Response (201)**:
```json
{
  "id": "ship-456",
  "order_id": "ord-123",
  "carrier": "fedex",
  "tracking_number": "7642847264826",
  "status": "shipped",
  "created_at": "2026-04-07T10:00:00Z"
}
```

---

### Get Shipment

```http
GET /orders/:id/shipments/:shipment_id
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "ship-456",
  "order_id": "ord-123",
  "carrier": "fedex",
  "tracking_number": "7642847264826",
  "tracking_url": "https://tracking.fedex.com/...",
  "status": "in_transit",
  "estimated_delivery": "2026-04-10",
  "created_at": "2026-04-07T10:00:00Z"
}
```

---

### Process Refund

```http
POST /orders/:id/refunds
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [
    {
      "product_id": "prod-456",
      "quantity": 1,
      "reason": "damaged"
    }
  ],
  "full_refund": false
}
```

**Response (201)**:
```json
{
  "id": "ref-789",
  "order_id": "ord-123",
  "amount": 29.99,
  "reason": "damaged",
  "status": "requested",
  "created_at": "2026-04-07T10:00:00Z"
}
```

---

### Get Refund

```http
GET /orders/:id/refunds/:refund_id
Authorization: Bearer <token>
```

---

### Cancel Order

```http
DELETE /orders/:id
Authorization: Bearer <token>
```

**Response (204)**: No content

**Notes**: Only allowed if order is still pending/processing

---

See [../README.md](../README.md) for base URL, auth, pagination
