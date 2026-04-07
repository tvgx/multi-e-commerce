# 🎨 Storefront — Overview

**Location**: `/home/troll/workspaces/ecommerce-platform/apps/storefront`

**Tech Stack**: Next.js 15 (App Router), React, Tailwind CSS, Framer Motion, Server Components

---

## Overview

Storefront is a **"Zero-File Engine"** — a dynamic storefront platform that renders customer-facing experiences from JSON configuration.

### Key Innovation

Instead of building custom storefronts for each shop:
- Admin builds layout in **visual builder** (Admin Dashboard)
- Layout saved as **JSON config** (MongoDB)
- Storefront **dynamically renders** from JSON
- No need to deploy new code per shop
- 1000+ shops = 1 Storefront codebase

---

## How It Works

```
Customer visits: shop1.example.com
         ↓
Middleware detects tenant (shop1)
         ↓
Fetch compiled layout JSON from API
         ↓
Component Resolver maps JSON → React components
         ↓
Render UI (Server Components for performance)
         ↓
Dynamic, unique experience per shop
```

---

## Quick Start

```bash
cd apps/storefront
npm install
npm run dev  # http://localhost:3000 (use localhost:3000/shop1, localhost:3000/shop2, etc.)
```

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [domain]/          # Dynamic nested routes for tenants
│   ├── layout.tsx         # Global layout
│   └── page.tsx           # Home page template
├── components/            # Shared React components
├── lib/
│   ├── api.ts            # Fetch layouts from API
│   ├── resolver.ts       # Component resolver (JSON → components)
│   └── hooks.ts          # Custom hooks
├── middleware.ts          # Domain detection
└── public/               # Static assets
```

---

## Component Registry

Maps component names in JSON to React components:

```typescript
// packages/ui-library/src/component-registry.ts
export const componentRegistry = {
  Header: import('@/components/Header'),
  ProductGrid: import('@/components/ProductGrid'),
  Banner: import('@/components/Banner'),
  Footer: import('@/components/Footer'),
};
```

**Admin JSON example**:
```json
{
  "nodes": [
    { "componentType": "Header", "props": { "logo": "..." } },
    { "componentType": "ProductGrid", "props": { "limit": 20 } },
    { "componentType": "Footer", "props": {} }
  ]
}
```

---

## Multi-Tenancy

Automatic tenant isolation:
- Middleware detects `shop1.example.com`
- Fetches layout for `shop1`
- All API calls scoped to `shop1`
- Styles/theme per shop (from JSON)

---

## Performance Optimizations

- **Server Components**: Reduce JS bundle size
- **Image Optimization**: Next.js Image with lazy loading
- **Streaming**: Suspense boundaries for slow blocks
- **Caching**: API responses cached (5 min default)

---

## Development

- **Linting**: `npm run lint`
- **Testing**: `npm run test` (Playwright E2E)
- **Multi-domain testing**: Use `/etc/hosts` or ngrok

---

See detailed docs: `components/`, `layout-engine.md`, `multi-tenancy.md`, `performance.md`

---

See [../README.md](../README.md) for all apps
