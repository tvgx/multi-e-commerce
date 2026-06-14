# Applications

Monorepo Turborepo: 4 app trong `apps/*` + 5 package dùng chung trong `packages/*` (`database`, `i18n`, `master-templates`, `schema`, `ui-registry`). Import `@ecommerce/*` phải khai báo trong `dependencies` (turbo dựng theo thứ tự phụ thuộc).

| App | Stack | Cổng dev | Làm gì |
|-----|-------|:-------:|--------|
| [api-core](api-core/) | NestJS 11, Prisma/PostgreSQL + Mongoose/MongoDB, Bull, better-auth | 3000 | Backend đa tenant phục vụ admin/storefront/cli |
| [admin](admin/) | Next.js (App Router), better-auth | 3001 | Bảng điều khiển người bán: tạo shop, builder, sản phẩm, đơn, analytics |
| [storefront](storefront/) | Next.js (App Router), Server Components | 3002 | Gian hàng người mua, render từ JSON layout |
| [cli-tool](cli-tool/) | Python (CLI) + Node (`tsx` layout sync) | — | Tự động hoá: tạo shop hàng loạt, backup, đồng bộ layout |

API: base `/api` (global prefix). Tài liệu endpoint chi tiết: [`/api-doc`](../../api-doc/).

Chạy 1 app: `cd apps/<app> && npm run dev`. Test: `npm run test` (api-core: jest; admin: playwright). Lint: `npm run lint`.
