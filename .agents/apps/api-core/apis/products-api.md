# 📦 Products API

Products, variants, inventory, and categories.

---

## Endpoints

### Create Product

```http
POST /products
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Vintage T-Shirt",
  "description": "Classic cotton t-shirt",
  "category_id": "cat-123",
  "sku": "TSH-001",
  "price": 29.99,
  "images": [
    {
      "url": "https://cdn.example.com/image1.jpg",
      "alt": "Front view"
    }
  ],
  "variants": [
    {
      "name": "Size",
      "options": ["XS", "S", "M", "L", "XL", "XXL"]
    },
    {
      "name": "Color",
      "options": ["Black", "White", "Gray"]
    }
  ]
}
```

**Response (201)**:
```json
{
  "id": "prod-456",
  "shop_id": "shop-123",
  "name": "Vintage T-Shirt",
  "sku": "TSH-001",
  "price": 29.99,
  "status": "published",
  "created_at": "2026-04-07T10:00:00Z"
}
```

**Errors**:
- `400`: Invalid price, missing required fields
- `409`: SKU already exists in shop

---

### List Products

```http
GET /products?page=1&limit=20&category=cat-123&status=published
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": "prod-456",
      "name": "Vintage T-Shirt",
      "sku": "TSH-001",
      "price": 29.99,
      "status": "published",
      "inventory": 145,
      "created_at": "2026-04-07T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 342 }
}
```

**Query Params**:
- `category` (string): Filter by category ID
- `status` (string): `published`, `draft`, `archived`
- `search` (string): Search by name/SKU
- `sort` (string): `name:asc`, `price:desc`, `created_at:desc`

---

### Get Product

```http
GET /products/:id
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "prod-456",
  "shop_id": "shop-123",
  "name": "Vintage T-Shirt",
  "description": "Classic cotton t-shirt",
  "category_id": "cat-123",
  "sku": "TSH-001",
  "price": 29.99,
  "cost": 10.00,
  "images": [
    {
      "url": "https://cdn.example.com/image1.jpg",
      "alt": "Front view"
    }
  ],
  "variants": [
    {
      "id": "var-789",
      "name": "Size",
      "options": ["XS", "S", "M", "L", "XL", "XXL"]
    }
  ],
  "inventory": 145,
  "status": "published",
  "created_at": "2026-04-07T10:00:00Z"
}
```

---

### Update Product

```http
PATCH /products/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "price": 34.99,
  "description": "Premium vintage t-shirt",
  "status": "published"
}
```

**Response (200)**: Updated product object

---

### Delete Product

```http
DELETE /products/:id
Authorization: Bearer <token>
```

**Response (204)**: No content

**Notes**: Soft delete (archived, not removed from DB)

---

### Create Variant

```http
POST /products/:id/variants
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Size",
  "options": ["XS", "S", "M", "L", "XL"]
}
```

**Response (201)**:
```json
{
  "id": "var-789",
  "product_id": "prod-456",
  "name": "Size",
  "options": ["XS", "S", "M", "L", "XL"],
  "created_at": "2026-04-07T10:00:00Z"
}
```

---

### Update Variant

```http
PATCH /products/:id/variants/:variant_id
Content-Type: application/json
Authorization: Bearer <token>

{
  "options": ["XS", "S", "M", "L", "XL", "XXL"]
}
```

---

### Get Variant SKUs

Get all combinations of variant options with inventory:

```http
GET /products/:id/skus
Authorization: Bearer <token>
```

**Response (200)**:
```json
[
  {
    "id": "sku-001",
    "product_id": "prod-456",
    "sku": "TSH-001-BLK-M",
    "name": "Vintage T-Shirt - Black - M",
    "variant_combination": {
      "Size": "M",
      "Color": "Black"
    },
    "price": 29.99,
    "inventory": 23
  }
]
```

---

### Update SKU Inventory

```http
PATCH /products/:id/skus/:sku_id/inventory
Content-Type: application/json
Authorization: Bearer <token>

{
  "quantity": 50,
  "operation": "set"  // or "add", "subtract"
}
```

**Response (200)**:
```json
{
  "id": "sku-001",
  "sku": "TSH-001-BLK-M",
  "inventory": 50,
  "updated_at": "2026-04-07T12:30:00Z"
}
```

---

### Bulk Update Products

```http
POST /products/bulk-update
Content-Type: application/json
Authorization: Bearer <token>

{
  "product_ids": ["prod-456", "prod-789"],
  "updates": {
    "price": 39.99,
    "status": "published"
  }
}
```

**Response (200)**:
```json
{
  "updated": 2,
  "failed": 0
}
```

---

See [../README.md](../README.md) for base URL, auth, pagination
