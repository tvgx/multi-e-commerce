# Quick Reference - Prisma Schema Commands

## Essential Commands

```bash
# Build schema from models
npm run schema:build

# Watch and auto-rebuild (dev mode)
npm run schema:watch

# Generate Prisma Client
npm run prisma:generate

# Create/run migrations
npm run prisma:migrate

# Open database GUI
npm run prisma:studio

# Using helper script (if preferred)
./scripts/schema.sh build
./scripts/schema.sh watch
./scripts/schema.sh generate
```

## Common Workflows

### Editing a Model

```bash
# 1. Edit file
nano prisma/models/product.prisma

# 2. Build and generate
npm run prisma:generate

# If adding new fields:
npm run prisma:migrate
```

### During Development

```bash
# Terminal 1: Auto-rebuild on changes
npm run schema:watch

# Terminal 2: Normal development
npm run dev
```

### Adding New Domain

```bash
# 1. Create new schema file
touch prisma/models/reviews.prisma

# 2. Add to build script
# Edit: scripts/build-prisma-schema.js
# Add 'reviews.prisma' to MODEL_FILES array

# 3. Build
npm run schema:build
```

## Directory Reference

```text
packages/database/
├── prisma/
│   ├── schema.prisma              ⚠️ Auto-generated
│   ├── schema.template.prisma     ✏️ Edit this for generator settings
│   └── models/                    ✏️ Edit these for models
│       ├── auth.prisma
│       ├── shop.prisma
│       ├── product.prisma
│       ├── inventory.prisma
│       ├── order.prisma
│       ├── payment.prisma
│       ├── geography-tax.prisma
│       ├── promotion.prisma
│       └── content.prisma
├── scripts/
│   ├── build-prisma-schema.js    Build automation
│   └── schema.sh                 Helper commands
├── prisma.config.ts              Config utilities
└── package.json                  NPM scripts
```

## File Organization

| Domain | File |
| --- | --- |
| 🔐 Auth | auth.prisma |
| 🏪 Shop | shop.prisma |
| 📦 Products | product.prisma |
| 📊 Inventory | inventory.prisma |
| 📋 Orders | order.prisma |
| 💳 Payment | payment.prisma |
| 🌍 Geography | geography-tax.prisma |
| 🎁 Promotions | promotion.prisma |
| 📄 Content | content.prisma |

## Tips & Tricks

### View Configuration

```bash
node -e "require('./prisma.config.ts').printConfig()"
```

### Check All Files Exist

```typescript
import { verifySchemaFiles } from './prisma.config';
if (!verifySchemaFiles()) process.exit(1);
```

### Auto-build Before Prisma CLI

```bash
npm run schema:build && npx prisma reset
npm run schema:build && npx prisma generate
```

## Important Reminders

✋ **Don't edit** `prisma/schema.prisma` - it's auto-generated  
✏️ **Always edit** files in `prisma/models/`  
🔨 **Always build** before Prisma operations  

## Troubleshooting

```bash
# Schema won't build?
npm run schema:build
# Check browser error output

# Prisma can't find schema?
npm run prisma:generate
# Uses schema:build automatically

# Need to reset?
npm run schema:build
npx prisma reset
```

---

For more info, see: `PRISMA_SCHEMA_GUIDE.md`

