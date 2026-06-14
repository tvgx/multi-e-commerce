# Access Control & RBAC

## Trong ứng dụng
- Người bán (admin): xác thực **better-auth**; guard `BetterAuthGuard` + `RolesGuard`, role `ADMIN`/`OWNER` (decorator `@RequireRoles`). Route công khai gắn `@Public()`.
- Người mua (storefront): `StorefrontAuthGuard` (phiên khách riêng).
- Đa tenant: dữ liệu cô lập theo `shopId` (tenant context / header `x-shop-id`). Không để 1 shop đọc dữ liệu shop khác.

## Vận hành (CLI/hạ tầng)
Quyền theo vai trò & chuỗi approval: [core-rules/roles-permissions.md](../core-rules/roles-permissions.md) + [AGENTS.md](../../AGENTS.md).

## Onboarding / Offboarding
- Onboarding: cấp key đúng vai trò (mức thấp nhất đủ dùng), thêm vào nhóm Slack/PagerDuty.
- Offboarding: thu hồi key ngay, xoay secret dùng chung mà người đó từng truy cập, gỡ quyền K8s/GitHub.
- Nguyên tắc least-privilege; rà soát quyền định kỳ.
