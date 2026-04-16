# 🎨 Layouts API

Layout builder, publish, compile, and versioning.

---

## Endpoints

### Create Layout

```http
POST /layouts
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Spring 2026 Collection",
  "description": "New spring layout",
  "sections": [
    {
      "id": "hero-1",
      "component_type": "Hero",
      "props": {
        "title": "Spring Collection",
        "image_url": "https://cdn.example.com/hero.jpg",
        "cta_text": "Shop Now",
        "cta_url": "/products?collection=spring"
      }
    },
    {
      "id": "products-1",
      "component_type": "ProductGrid",
      "props": {
        "category_id": "cat-123",
        "limit": 12,
        "columns": 4
      }
    }
  ]
}
```

**Response (201)**:
```json
{
  "id": "layout-456",
  "shop_id": "shop-123",
  "name": "Spring 2026 Collection",
  "status": "draft",
  "version": 1,
  "created_at": "2026-04-07T10:00:00Z"
}
```

---

### List Layouts

```http
GET /layouts?status=published&sort=created_at:desc
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": "layout-456",
      "name": "Spring 2026 Collection",
      "status": "published",
      "version": 3,
      "created_at": "2026-04-07T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 12 }
}
```

**Query Params**:
- `status` (string): `draft`, `published`, `archived`

---

### Get Layout

```http
GET /layouts/:id
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "layout-456",
  "shop_id": "shop-123",
  "name": "Spring 2026 Collection",
  "description": "New spring layout",
  "status": "published",
  "version": 3,
  "sections": [
    {
      "id": "hero-1",
      "component_type": "Hero",
      "props": {
        "title": "Spring Collection",
        "image_url": "https://cdn.example.com/hero.jpg"
      }
    }
  ],
  "created_at": "2026-04-07T10:00:00Z",
  "published_at": "2026-04-07T12:00:00Z"
}
```

---

### Update Layout (Draft)

```http
PATCH /layouts/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Spring 2026 Collection - Updated",
  "sections": [
    {
      "id": "hero-1",
      "props": {
        "title": "Updated Title"
      }
    }
  ]
}
```

**Response (200)**: Updated layout object

**Notes**: Only allowed on draft/unpublished layouts. Published layouts are versioned.

---

### Publish Layout

```http
POST /layouts/:id/publish
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "layout-456",
  "status": "published",
  "version": 1,
  "compiled_at": "2026-04-07T10:00:00Z",
  "storefront_live_at": "2026-04-07T10:05:00Z"
}
```

**Notes**:
- Creates immutable version
- Compiles all sections (validates components, resolves images)
- Pushes to CDN for Storefront
- 5-min delay before live on Storefront

---

### Get Published Version

```http
GET /layouts/:id/versions/:version_number
Authorization: Bearer <token>
```

**Response (200)**: Published layout version object

---

### Revert to Previous Version

```http
POST /layouts/:id/revert
Content-Type: application/json
Authorization: Bearer <token>

{
  "version": 2
}
```

**Response (200)**:
```json
{
  "id": "layout-456",
  "status": "published",
  "version": 4,
  "reverted_from_version": 2,
  "published_at": "2026-04-07T12:30:00Z"
}
```

---

### Delete Layout

```http
DELETE /layouts/:id
Authorization: Bearer <token>
```

**Response (204)**: No content

**Notes**: Only allowed on draft layouts. Published layouts archived instead.

---

## Layout Structure

**Component Types**:
- `Hero` — Full-width banner with image + CTA
- `ProductGrid` — Grid of products with filters
- `TextBlock` — Rich text + media
- `Testimonials` — Customer reviews carousel
- `Banner` — Static or animated banner
- `Newsletter` — Email signup form
- `Footer` — Footer links + socials

**Each component validates props** before compilation.

---

See [../README.md](../README.md) for base URL, auth, pagination
