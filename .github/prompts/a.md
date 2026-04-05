TL;DR

Triển khai theo hướng:

Starter → luôn shared
Pro/Enterprise → shared mặc định, auto-promote → dedicated khi vượt ngưỡng
Toàn bộ chạy trên 1 Kubernetes cluster (MVP)
Dedicated tenant có DB cluster riêng + namespace riêng
🚀 Phase 1 — Data Model & Tiering Foundation
Mục tiêu

Thiết lập nguồn dữ liệu quyết định routing (shared vs dedicated)

Steps
Bổ sung schema:
Tenant plan (Starter / Pro / Enterprise)
Usage metrics (CPU / memory / request)
Infra assignment:
mode: shared | dedicated
namespace
db_cluster
Promotion state:
NONE
PENDING
PROVISIONING
ACTIVE
FAILED
ROLLBACK
Cập nhật tại:
packages/database/prisma/schema.prisma
Tạo migration + seed:
Default:
Starter → shared
Pro/Enterprise → shared (initial)
⚙️ Phase 2 — Runtime Routing (Shared vs Dedicated)
Mục tiêu

Backend hiểu tenant đang chạy ở mode nào

Steps
Mở rộng tenant context:
tenant.service.ts
Trả về:
plan
mode
db target
Inject vào request lifecycle:
tenant.middleware.ts
app.module.ts
Prisma datasource resolver:
prisma.service.ts
Switch:
shared DB
dedicated DB cluster
Cache isolation:
cache.service.ts
Key format:
{tenant_id}:{mode}:{resource}
🤖 Phase 3 — Auto-Promotion Engine
Mục tiêu

Chỉ Pro/Enterprise mới được promote khi vượt ngưỡng

Steps
Xây evaluator:
Input:
plan
CPU / memory usage
Rule:
Starter → always shared
Pro/Enterprise → check threshold
Trigger promotion:
shop.service.ts
State machine:
NONE → PENDING → PROVISIONING → ACTIVE
                         ↓
                      FAILED → ROLLBACK
Persist state:
shop module
system module
☸️ Phase 4 — Dedicated Infrastructure Provisioning (K8s)
Mục tiêu

Tạo namespace riêng + workload riêng cho tenant lớn

Steps
Generate namespace per tenant
Tạo workload template:
api-core
storefront
admin

Từ:

k8s/apps/api-core.yaml
k8s/apps/storefront.yaml
k8s/apps/admin.yaml
Tạo ingress riêng:
k8s/ingress/ingress.yaml
Provision secrets:
scripts/create-k8s-secrets.sh
Provision DB cluster riêng:
adapter trong apps/api-core/src/system
🔀 Phase 5 — Cutover Routing
Mục tiêu

Chuyển traffic sang dedicated stack mà không downtime

Steps
Update routing logic:
shop.service.ts
resolve endpoint theo mode
Update storefront proxy:
apps/storefront/src/proxy.ts
Domain routing:
Dedicated tenant → dedicated ingress
Shared tenant → shared ingress
Admin hiển thị:
tenant mode (shared / dedicated)
provisioning status
🛡️ Phase 6 — Ops Safety & Rollback
Mục tiêu

Đảm bảo hệ thống an toàn khi promotion fail

Steps
Rollback flow:
nếu provisioning fail:
revert về shared
cleanup resource
Monitoring:
thêm label theo tenant:
tenant_id
mode
k8s/infrastructure/monitoring.yaml
Backup:
job riêng cho từng dedicated tenant
k8s/jobs