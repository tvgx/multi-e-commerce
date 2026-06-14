# admin — Bảng điều khiển người bán

**Stack**: Next.js (App Router), better-auth, Tailwind. Dev cổng **3001** (`npm run dev`).

Trung tâm vận hành của người bán. Gọi api-core qua `src/lib/api-client.ts`.

## Tính năng & API liên quan

| Tính năng | Trang (`src/app`) | API (xem [api-doc](../../../api-doc/)) |
|-----------|-------------------|-----------------------------------------|
| Xác thực người bán | `(auth)/*` | [auth](../../../api-doc/auth/) |
| Tạo & khởi tạo gian hàng | `create-shop/*` (wizard → billing-shipping) | [shop](../../../api-doc/shop/), [build](../../../api-doc/build/), [geo](../../../api-doc/geo/) |
| Builder giao diện | `dashboard/[shopId]/online-store/*` | [layout](../../../api-doc/layout/), [templates](../../../api-doc/templates/), [media](../../../api-doc/media/) |
| Sản phẩm & danh mục | `dashboard/[shopId]/products`, `collections`, `inventory` | [catalog](../../../api-doc/catalog/), [inventory](../../../api-doc/inventory/) |
| Đơn hàng | `dashboard/[shopId]/orders/*` | [order](../../../api-doc/order/) |
| Khuyến mãi / Thanh toán / Ship | `promotions`, `payments`, `settings/shipping` | [promotions](../../../api-doc/promotions/), [payment](../../../api-doc/payment/), [shipping](../../../api-doc/shipping/) |
| Ví / Analytics | `wallets`, `analytics` | [wallet](../../../api-doc/wallet/), [analytics](../../../api-doc/analytics/) |
| Quản trị nền tảng | `dashboard/(platform)/*` | analytics platform, shops |

Đa ngôn ngữ qua `@ecommerce/i18n` (cookie `NEXT_LOCALE`, `useTranslations`). Lint `npm run lint`, E2E `npm run test:ui` (Playwright).
