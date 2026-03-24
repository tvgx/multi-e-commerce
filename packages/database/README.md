# Database Package (Prisma)

This package contains the global Prisma schema and database client for the platform.

## Features
- **Primary DB**: PostgreSQL (Users, Shops, Products).
- **Secondary DB**: MongoDB (Layouts, Metadata).
- **Sharding**: Ready for multi-tenant data isolation.

## Getting Started

### Prerequisites
- A running PostgreSQL instance.
- A running MongoDB instance.

### Development
1. **Environment Variables**: Configure your `.env` in the project root with `DATABASE_URL`.
2. **Sync Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. **Prisma Studio**:
   ```bash
   npx prisma studio
   ```

---
Part of the [Platform Name] multi-tenant e-commerce ecosystem.
