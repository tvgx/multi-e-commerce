# `.agents/` — Hub hướng dẫn dự án multi-ecommerce

Kho quy tắc & tài liệu cho người và AI agent. Đọc [AGENTS.md](../AGENTS.md) (gốc repo) cho ma trận quyền & phê duyệt.

## Tìm nhanh

| Cần gì | Vào đâu |
|--------|---------|
| Hiểu app/module/feature/API | [apps/](apps/) + [`/api-doc`](../api-doc/) |
| Quy tắc cốt lõi (cho người & agent) | [core-rules/principles.md](core-rules/principles.md), [rules/project.md](rules/project.md) |
| Builder Zero-File | [rules/builder-rules.md](rules/builder-rules.md) |
| Chuẩn code / commit / branch | [code-conventions/](code-conventions/) |
| Quy trình PR | [pr-workflow/](pr-workflow/) |
| Thao tác rủi ro cao (delete/restore/sync prod) | [high-risk-ops/](high-risk-ops/) |
| Hạ tầng / deploy / rollback | [infrastructure/](infrastructure/) |
| CSDL: migration / backup | [database/](database/) |
| Bảo mật / secret / RBAC | [security/](security/) |
| Giám sát | [monitoring/](monitoring/) |
| Sự cố / on-call | [escalation/](escalation/) |
| Phát hành / version | [release/](release/) |
| Quy tắc cho agent tự động (CI/CD, K8s) | [agents/](agents/) |
| Gỡ lỗi | [troubleshooting/](troubleshooting/) |
| Đặc tả use-case ShopVolo v2 | [SHOPVOLO_V2_SPEC.md](SHOPVOLO_V2_SPEC.md) |

## Cây thư mục (thực tế)

```
.agents/
├── apps/          # api-core, admin, storefront, cli-tool (+ api-core/apis tóm tắt)
├── core-rules/    # principles, roles-permissions, escalation-contacts
├── rules/         # project (Zero-File doctrine), builder-rules, .prompt
├── code-conventions/  branching, commit-messages, linting-testing, typescript-styles, python-styles
├── pr-workflow/   checklist, template, review-rules, merge-strategy
├── high-risk-ops/ operations-matrix, approval-workflow-{standard,critical}, dry-run-procedures
├── infrastructure/ environments, manifests, deployment-procedure, deployment-windows, rollback
├── database/      schema-changes, migrations, backup-restore
├── monitoring/    health-checks
├── security/      secret-management, access-control, scanning-compliance
├── agents/        automation-rules, ci-cd-rules, copilot-guidelines
├── escalation/    support-levels, on-call-procedures
├── release/       versioning, release-process
└── troubleshooting/
```

## Sự thật nền tảng (đừng nhầm)

- API prefix là **`/api`** (không phải `/api/v1`). Controller số nhiều: `/api/shops`, `/api/orders`...
- Response envelope `{ code, message, data }`, `code "1000"` = OK. Bảng mã: [api-doc/README](../api-doc/README.md).
- Đăng ký người bán: `POST /api/auth/register` (kèm tạo shop); tạo shop: `POST /api/shops`. Không có `/api/v1/tenants/register`.
- Stack: NestJS 11 + Prisma/PostgreSQL + Mongoose/MongoDB (layout, chat) + Bull/Redis + better-auth + MinIO. Monorepo Turborepo.
