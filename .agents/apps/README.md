# 📱 Applications — Overview & Quick Links

Detailed guides for developing & maintaining the 4 apps.

---

## 4 Applications

### 1. 🛡️ **Admin Dashboard** (Next.js 15, React)
Location: `/home/troll/workspaces/ecommerce-platform/apps/admin`

**Purpose**: Merchant dashboard for managing shops, products, orders, layouts

**Key Features**:
- Visual layout builder (drag-drop)
- Shop configuration
- Product management
- Order tracking
- Analytics

**Tech Stack**: Next.js 15, Better Auth, React Hook Form, Recharts

**Quick Start**:
```bash
cd apps/admin
npm install
npm run dev  # http://localhost:5200
npm run test
npm run lint
```

**More Info**: [admin/README.md](admin/)

---

### 2. 🚀 **API Core** (NestJS, TypeScript)
Location: `/home/troll/workspaces/ecommerce-platform/apps/api-core`

**Purpose**: Central backend API, multi-tenant, hybrid DB (PostgreSQL + MongoDB)

**Key Endpoints**:
- `/api/v1/shops` - Shop CRUD
- `/api/v1/products` - Products, variants, inventory
- `/api/v1/orders` - Orders, fulfillment
- `/api/v1/layouts` - Layout publish, compile
- `/api/v1/analytics` - Shop stats, master summary

**Tech Stack**: NestJS 11, Prisma (PostgreSQL), Mongoose (MongoDB)

**Quick Start**:
```bash
cd apps/api-core
npm install
npm run dev  # http://localhost:3000
npm run test
npm run lint
```

**Multi-Tenancy**: AsyncLocalStorage + TenantInterceptor (auto-scoping by shopId)

**More Info**: [api-core/README.md](api-core/)

---

### 3. 💻 **CLI Tool** (Python)
Location: `/home/troll/workspaces/ecommerce-platform/apps/cli-tool`

**Purpose**: Production automation, batch operations, disaster recovery

**Key Commands**:
- `python main.py shop create/list/delete`
- `python main.py backup create/restore/rollback`
- `python main.py batch create <--csv>`
- `python main.py health check --auto-fix`
- `python main.py audit view`

**Tech Stack**: Python 3.10+, argparse, Requests, PostgreSQL + MongoDB clients

**5 Phases Implemented**: ✅ Architecture, Data Integrity, Workflows, Automation, Integration

**Quick Start**:
```bash
cd apps/cli-tool
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py --help
```

**More Info**: [cli-tool/README.md](cli-tool/)

---

### 4. 🎨 **Storefront** (Next.js 15, React)
Location: `/home/troll/workspaces/ecommerce-platform/apps/storefront`

**Purpose**: "Zero-File Engine" — dynamic storefront powered by JSON layout config

**How It Works**:
1. Request to domain (shop1.example.com)
2. Middleware detects tenant
3. Fetch compiled layout JSON from API
4. Component resolver maps JSON → React components
5. Render final UI

**Tech Stack**: Next.js 15 (App Router), Tailwind, Framer Motion, Server Components

**Quick Start**:
```bash
cd apps/storefront
npm install
npm run dev  # http://localhost:3000 (multi-domain)
npm run test
npm run lint
```

**Component Registry**: `packages/ui-library` (shared UI components)

**More Info**: [storefront/README.md](storefront/)

---

## Which App Should I Work On?

| If You Want To... | Go To |
|---|---|
| Build merchant UI, dashboards | [admin/](admin/) |
| Create API endpoints, business logic | [api-core/](api-core/) |
| Automation, CI/CD, shop operations | [cli-tool/](cli-tool/) |
| Build customer-facing storefront | [storefront/](storefront/) |

---

## Common Workflows

### Add a New Feature

1. Pick your app above
2. Read `<app>/README.md` (architecture overview)
3. Read `<app>/development.md` (local dev setup)
4. Create feature branch: `git checkout -b feature/my-feature`
5. Code + test
6. Open PR (see `../pr-workflow/`)

### Test a Feature

```bash
# Run in app directory
npm run test          # Run tests
npm run test:watch   # Watch mode
npm run test:cov     # Coverage report
npm run lint         # Linting
```

### Deploy to Production

See [../infrastructure/](../infrastructure/) for deployment procedure.

---

**App-specific details** → Select an app folder above
