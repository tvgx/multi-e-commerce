# 🛡️ Admin Dashboard — Overview

**Location**: `/home/troll/workspaces/ecommerce-platform/apps/admin`

**Tech Stack**: Next.js 15, React, Better Auth, Tailwind, Recharts

---

## Overview

Admin Dashboard is the **merchant-facing control center** for managing e-commerce operations.

### Key Features

- **Layout Builder**: Visual drag-drop interface for storefront customization
- **Shop Management**: Create, configure, enable/disable shops
- **Products**: Full product catalog management (categories, SKU, variants)
- **Orders**: Track orders, manage fulfillment, payments
- **Analytics**: Dashboard with revenue, conversion,  metrics
- **Auth**: Role-based access (super admin, shop owner)

---

## Quick Start

```bash
cd apps/admin
npm install
npm run dev  # http://localhost:5200
```

---

## Directory Structure

```
src/
├── app/               # Next.js App Router pages
├── components/        # React components
├── lib/
│   ├── auth.ts       # Better Auth integration
│   └── api.ts        # API client
├── hooks/            # Custom React hooks
└── styles/           # Tailwind + global styles
```

---

## Development

- **Linting**: `npm run lint`
- **Testing**: `npm run test` (Playwright E2E)
- **Hot reload**: Automatic on file save

---

## docs for detailed architecture & features

See directory: `features/` → layout-builder.md, shop-management.md, products.md, orders.md, analytics.md

---

See [../README.md](../README.md) for all apps
