# 🚀 API Core — Overview

**Location**: `/home/troll/workspaces/ecommerce-platform/apps/api-core`

**Tech Stack**: NestJS 11, Prisma (PostgreSQL), Mongoose (MongoDB), TypeScript, OpenAPI

---

## Overview

API Core is the **backend engine** serving Admin Dashboard, Storefront, CLI Tool, and integration partners.

### Key Characteristics

- **Multi-Tenant**: AsyncLocalStorage + TenantInterceptor (automatic shopId scoping)
- **Hybrid Database**: PostgreSQL (structured data) + MongoDB (flexible config)
- **RESTful API**: OpenAPI 3.0 documented
- **Authentication**: JWT tokens, role-based access

---

## Quick Start

```bash
cd apps/api-core
npm install
npm run dev  # http://localhost:3000
```

---

## Directory Structure

```
src/
├── app.module.ts           # Root module
├── common/
│   ├── decorator/          # Custom decorators (@Auth, @Tenant)
│   └── interceptor/        # TenantInterceptor
├── modules/
│   ├── shops/
│   ├── products/
│   ├── orders/
│   ├── layouts/
│   └── analytics/
├── database/
│   ├── prisma/            # Prisma schema + migrations
│   └── mongodb/           # Mongoose models
└── test/                  # Jest test files
```

---

## Key APIs

- `GET /api/v1/shops` — List shops
- `POST /api/v1/products` — Create product
- `GET /api/v1/orders/:id` — Get order
- `POST /api/v1/layouts/publish` — Publish layout
- `GET /api/v1/analytics/shop/:shopId/summary` — Shop metrics

---

## Multi-Tenancy Pattern

Every request stored with `shopId`:
```typescript
// TenantInterceptor auto-extracts shopId from header or domain
// Database queries auto-scoped to current tenant
const products = await this.db.products.findMany({
  where: { shopId: getCurrentTenantId() }  // Auto-added
});
```

---

## development

- **Linting**: `npm run lint`
- **Testing**: `npm run test` (Jest + integration DB)
- **Database**: `npm run prisma migrate` (add migrations)

---

See detailed docs: `apis/`, `database/`, `testing.md`

---

See [../README.md](../README.md) for all apps
