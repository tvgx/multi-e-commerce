# Prisma Schema Modularization

## Overview

The Prisma schema has been modularized into separate files for better organization and maintainability. Each domain/feature area has its own schema file.

## Directory Structure

```text
packages/database/
├── prisma/
│   ├── schema.prisma              # ⚠️  AUTO-GENERATED - Do NOT edit directly
│   ├── schema.template.prisma     # Template with generator/datasource config
│   └── models/                    # Individual entity schemas
│       ├── auth.prisma            # User, Session, Account, Verification
│       ├── shop.prisma            # Shop, Customer
│       ├── product.prisma         # Product, Variant, Option*, ProductCollection*
│       ├── inventory.prisma       # StockLocation, StockItem, StockMovement
│       ├── order.prisma           # Order, LineItem, Shipment, InventoryUnit, Adjustment
│       ├── payment.prisma         # PaymentMethod, Payment
│       ├── geography-tax.prisma   # Market, Country, Zone, TaxCategory, TaxRate
│       ├── promotion.prisma       # Promotion, CouponCode
│       └── content.prisma         # Collection, NavigationMenu, ShopPage, Cache
├── scripts/
│   └── build-prisma-schema.js    # Build script to concatenate schema files
├── prisma.config.ts              # Configuration module
└── package.json                  # Updated with schema build scripts
```

## How It Works

1. **Individual Model Files**: Each domain has its own `.prisma` file in `prisma/models/`
2. **Schema Template**: `schema.template.prisma` contains the generator and datasource definitions
3. **Build Script**: `scripts/build-prisma-schema.js` concatenates all files into the final `schema.prisma`

## Usage

### Building the Schema

Before running any Prisma commands, build the complete schema:

```bash
npm run schema:build
```

### Automatic Prisma Commands

Use these convenient shortcuts that automatically build the schema first:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

### Watch Mode

During development, watch for changes and automatically rebuild:

```bash
npm run schema:watch
```

This requires the `chokidar` package (optional dependency).

## Adding New Models

1. **Create a new domain file** (e.g., `prisma/models/reviews.prisma`):

```prisma
// ==========================================
// Review Models
// ==========================================

model Review {
  id        String   @id @default(uuid())
  productId String
  rating    Int
  // ... rest of your model
}
```

2. **Add to build script**: Edit `scripts/build-prisma-schema.js` and add the filename to `MODEL_FILES` array

3. **Build the schema**:

```bash
npm run schema:build
```

## Editing Existing Models

1. **Edit the model file**: Make changes in the appropriate file under `prisma/models/`
2. **Build the schema**: `npm run schema:build`
3. **Generate/Migrate**: `npm run prisma:generate` or `npm run prisma:migrate`

## Important Notes

- ⚠️  **Never edit `schema.prisma` directly** - it's auto-generated
- Always edit files in `prisma/models/`
- Run `npm run schema:build` or use `npm run prisma:*` commands before Prisma CLI calls
- Each model file should be self-contained and include all its relations

## Prisma Configuration

The `prisma.config.ts` file provides utility functions:

```typescript
import { getPrismaConfig, verifySchemaFiles } from './prisma.config';

// Get configuration
const config = getPrismaConfig();

// Verify all files exist
if (verifySchemaFiles()) {
  console.log('✅ All schema files present');
}
```

## Model Organization

Models are organized by domain:

| Domain | File | Models |
| --- | --- | --- |
| **Authentication** | `auth.prisma` | User, Session, Account, Verification |
| **Shop** | `shop.prisma` | Shop, Customer |
| **Products** | `product.prisma` | Product, Variant, OptionType, OptionValue, etc. |
| **Inventory** | `inventory.prisma` | StockLocation, StockItem, StockMovement |
| **Orders** | `order.prisma` | Order, LineItem, Shipment, Adjustment |
| **Payments** | `payment.prisma` | PaymentMethod, Payment |
| **Geography & Tax** | `geography-tax.prisma` | Market, Country, Zone, TaxCategory, TaxRate |
| **Promotions** | `promotion.prisma` | Promotion, CouponCode |
| **Content** | `content.prisma` | Collection, NavigationMenu, ShopPage |

## Benefits

- ✅ **Better Organization**: Schemas grouped by domain/feature
- ✅ **Easier Navigation**: Find models faster in dedicated files
- ✅ **Team Collaboration**: Reduced merge conflicts with smaller files
- ✅ **Scalability**: Easier to add new domains without bloating a single file
- ✅ **Maintainability**: Context-specific changes stay together

## Troubleshooting

### Schema not building

```bash
npm run schema:build
# Check for errors in prisma/models/ files
```

### Prisma can't find schema

```bash
npm run prisma:generate
# Use the convenience script which builds first
```

### Out of sync after editing

```bash
npm run schema:build
npm run prisma:generate
```

## Related Files

- [`prisma.config.ts`](../prisma.config.ts) - Configuration utilities
- [`scripts/build-prisma-schema.js`](../scripts/build-prisma-schema.js) - Build script

