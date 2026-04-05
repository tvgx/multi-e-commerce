## Plan: Tiered Tenant Resource Allocation

Áp dụng mô hình phân bổ tài nguyên theo 2 lớp:
1. Small tenant chạy shared multi-tenant cluster.
2. Big tenant chạy dedicated full stack.
3. Trigger auto-promotion dùng plan + usage (CPU/memory), theo quyết định bạn đã chọn.

### TL;DR
MVP sẽ triển khai end-to-end trên cùng Kubernetes cluster:
1. Starter luôn shared.
2. Pro/Enterprise chỉ chuyển dedicated khi vượt ngưỡng usage.
3. Big tenant có DB cluster riêng cho từng tenant, stack dùng chung cho toàn bộ dự án.

### Steps
1. Phase 1: Bổ sung schema cho tiering và assignment.
2. Thêm mô hình plan, usage metrics, infra assignment, promotion state trong [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma).
3. Tạo migration + seed policy Starter/Pro/Enterprise trong [packages/database/prisma/prisma](packages/database/prisma/prisma).

4. Phase 2: Routing runtime theo shared/dedicated trong backend.
5. Mở rộng context tenant tại [apps/api-core/src/common/services/tenant.service.ts](apps/api-core/src/common/services/tenant.service.ts).
6. Gắn allocation context trong [apps/api-core/src/common/middleware/tenant.middleware.ts](apps/api-core/src/common/middleware/tenant.middleware.ts) và [apps/api-core/src/app.module.ts](apps/api-core/src/app.module.ts).
7. Thêm datasource resolver shared vs dedicated trong [apps/api-core/src/database/prisma.service.ts](apps/api-core/src/database/prisma.service.ts).
8. Chuẩn hóa cache key theo tenant/mode trong [apps/api-core/src/system/cache/cache.service.ts](apps/api-core/src/system/cache/cache.service.ts).

9. Phase 3: Auto-promotion state machine.
10. Tạo evaluator để chỉ Pro/Enterprise mới được xét promotion trong [apps/api-core/src/shop/shop.service.ts](apps/api-core/src/shop/shop.service.ts).
11. Lưu trạng thái provisioning/cutover/rollback trong module shop và system tại [apps/api-core/src/shop](apps/api-core/src/shop) và [apps/api-core/src/system](apps/api-core/src/system).

12. Phase 4: Provision dedicated namespace thật trên K8s.
13. Tạo template workload/ingress tenant riêng dựa trên [k8s/apps/api-core.yaml](k8s/apps/api-core.yaml), [k8s/apps/storefront.yaml](k8s/apps/storefront.yaml), [k8s/apps/admin.yaml](k8s/apps/admin.yaml), [k8s/ingress/ingress.yaml](k8s/ingress/ingress.yaml).
14. Mở rộng provisioning secrets từ [scripts/create-k8s-secrets.sh](scripts/create-k8s-secrets.sh).
15. Tích hợp adapter tạo dedicated DB cluster cho từng big tenant trong [apps/api-core/src/system](apps/api-core/src/system).

16. Phase 5: Cutover routing.
17. Đồng bộ shop resolver + domain routing tại [apps/api-core/src/shop/shop.service.ts](apps/api-core/src/shop/shop.service.ts) và [apps/storefront/src/proxy.ts](apps/storefront/src/proxy.ts) để tenant dedicated đi đúng endpoint dedicated.
18. Hiển thị trạng thái mode trong admin tại [apps/admin/src/app](apps/admin/src/app).

19. Phase 6: Ops safety và rollback.
20. Thêm rollback flow khi provisioning fail trong [apps/api-core/src/shop/shop.service.ts](apps/api-core/src/shop/shop.service.ts).
21. Bổ sung monitoring labels tại [k8s/infrastructure/monitoring.yaml](k8s/infrastructure/monitoring.yaml).
22. Bổ sung backup jobs per dedicated tenant trong [k8s/jobs](k8s/jobs).

### Relevant files
1. [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
2. [apps/api-core/src/common/middleware/tenant.middleware.ts](apps/api-core/src/common/middleware/tenant.middleware.ts)
3. [apps/api-core/src/common/services/tenant.service.ts](apps/api-core/src/common/services/tenant.service.ts)
4. [apps/api-core/src/database/prisma.service.ts](apps/api-core/src/database/prisma.service.ts)
5. [apps/api-core/src/shop/shop.service.ts](apps/api-core/src/shop/shop.service.ts)
6. [apps/api-core/src/system/cache/cache.service.ts](apps/api-core/src/system/cache/cache.service.ts)
7. [apps/storefront/src/proxy.ts](apps/storefront/src/proxy.ts)
8. [k8s/apps/api-core.yaml](k8s/apps/api-core.yaml)
9. [k8s/apps/storefront.yaml](k8s/apps/storefront.yaml)
10. [k8s/apps/admin.yaml](k8s/apps/admin.yaml)
11. [k8s/ingress/ingress.yaml](k8s/ingress/ingress.yaml)
12. [scripts/create-k8s-secrets.sh](scripts/create-k8s-secrets.sh)

### Verification
1. Unit test assignment resolver: Starter luôn shared; Pro/Enterprise chỉ dedicated khi vượt ngưỡng.
2. Integration test provisioning state machine: PENDING → PROVISIONING → ACTIVE hoặc FAILED→ROLLBACK.
3. E2E K8s: tạo được namespace/service/deployment/ingress dedicated cho tenant đủ điều kiện.
4. Data path test: tenant dedicated dùng dedicated DB cluster; tenant shared dùng shared datasource.
5. Routing test: domain của dedicated tenant đi dedicated stack; tenant còn lại vẫn shared.
6. Regression: build, audit, và các flow admin/storefront/api không vỡ import/export.

### Decisions locked
1. Tier theo plan Starter/Pro/Enterprise.
2. Trigger auto-promotion: Pro/Enterprise + vượt ngưỡng usage.
3. Usage metric ưu tiên: CPU/memory usage thực tế trên cluster.
4. Big tenant dùng dedicated full stack.
5. Dedicated data: 1 DB cluster riêng cho mỗi big tenant.
6. MVP chạy cùng cluster, tách namespace per tenant.

Nếu bạn duyệt plan này, bước tiếp theo sẽ là thực thi Phase 1 và Phase 2 trước để tạo nền tảng routing và dữ liệu cho cơ chế shared vs dedicated.
