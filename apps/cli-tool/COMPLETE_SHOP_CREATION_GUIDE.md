# Complete Shop Creation Guide

**Last Updated**: April 6, 2026  
**Status**: Ready for Execution  
**Dev Environment**: localhost with placeholder images

---

## 🎯 Objective

Create a complete fashion shop with:
- ✅ PostgreSQL owner & shop records
- ✅ 35 realistic fashion products (4 categories)
- ✅ Inventory tracking (50-300 stock per item)
- ✅ 10 mock orders with line items
- ✅ Image placeholders (Unsplash URLs)
- ✅ All 3 mini-apps connected and verified

---

## ⚠️ Prerequisites

**Before you start**, ensure:

1. **Docker Desktop running**
   - Windows: Start Docker Desktop from system tray (look for Docker icon)
   - Verify: Open PowerShell and run `docker ps` → should see container list
   - Check that WSL 2 integration is enabled (Settings > Resources > WSL integration)

2. **PostgreSQL & MongoDB running**
   ```bash
   # In a Windows PowerShell terminal, navigate to workspace:
   cd C:\Users\<YourUser>\workspaces\ecommerce-platform\docker
   
   # Start containers (this is step #1 - MUST HAPPEN FIRST)
   docker compose up -d
   
   # Verify running:
   docker ps
   # You should see postgres-shard-1, postgres-shard-2, and mongodb
   ```

3. **Node.js dependencies installed**
   ```bash
   cd /home/troll/workspaces/ecommerce-platform
   npm install
   npm run build  # Build all packages
   ```

4. **Environment variables set** (if not using defaults)
   ```bash
   # .env file in /apps/cli-tool or via exports:
   export MONGODB_URI="mongodb://admin:password@localhost:27017/ecommerce_ui?authSource=admin"
   export DATABASE_URL="postgresql://admin:password@localhost:5432/shop_db_1?schema=public"
   ```

---

## 🚀 Step-by-Step Execution

### **Step 1: START DATABASES** (Windows Terminal - Required First)

Open **PowerShell** and run (this enables all subsequent steps):

```powershell
cd C:\Users\<YourUser>\workspaces\ecommerce-platform\docker
docker compose up -d

# Wait ~15 seconds, then verify:
docker ps
# Should show 3 containers: postgres-shard-1, postgres-shard-2, mongodb
```

**If unsuccessful**: 
- Check Docker Desktop is running (system tray icon)
- Ensure WSL 2 integration enabled
- Retry: `docker compose down && docker compose up -d`

---

### **Step 2: FIX SCHEMA** ✅ (Already Done)

The Mongoose schema has been fixed:
- Added `type: String` to `ProductLayout.productId` and `shopId`  
- TypeScript compilation verified (no errors)
- File: `apps/api-core/src/product/schemas/product-layout.schema.ts`

---

### **Step 3: START API CORE** (Linux Terminal - Tab 1)

In VS Code Terminal (or new WSL tab):

```bash
cd /home/troll/workspaces/ecommerce-platform/apps/api-core

npm run dev
# Expected output:
# [NestFactory] Nest application successfully started on port 3000
# [InstanceLoader] TypeORMModule dependencies initialized...
```

**Wait for**: `successfully started on port 3000` message ✅

---

### **Step 4: START ADMIN DASHBOARD** (Linux Terminal - Tab 2)

New terminal tab in VS Code:

```bash
cd /home/troll/workspaces/ecommerce-platform/apps/admin

npm run dev
# Expected output:
# Ready in 2.5s
# Local:        http://localhost:3001
```

**Wait for**: `Ready in Xs` message ✅

---

### **Step 5: START STOREFRONT** (Linux Terminal - Tab 3)

New terminal tab in VS Code:

```bash
cd /home/troll/workspaces/ecommerce-platform/apps/storefront

npm run dev
# Expected output:
# Ready in 2.5s
# Local:        http://localhost:3002
```

**Wait for**: `Ready in Xs` message ✅

---

### **Step 6: CREATE SHOP VIA CLI** (Linux Terminal - Tab 4)

New terminal tab:

```bash
cd /home/troll/workspaces/ecommerce-platform/apps/cli-tool

python main.py shop create \
  --name "Test Fashion Shop" \
  --domain test.localhost:5201 \
  --owner-email testowner@example.com \
  --template fashion \
  --products-per-page 30

# Expected output:
# ✅ Creating shop...
# ✅ Stage 1: Owner user created (user_id: ...)
# ✅ Stage 2: Shop record created (shop_id: ...)
# ✅ Stage 3: Template seeded
# ✅ Stage 4: Demo products seeded
# 🎉 Shop created successfully!
#    Shop ID: <COPY THIS UUID>
```

**⚠️ IMPORTANT**: Copy the **shop_id** UUID from output. You'll need it for next steps.

Example: `aabbccdd-eeff-0011-2233-445566778899`

---

### **Step 7: SEED MOCK DATA** (Linux Terminal - Tab 4, continued)

Using the shop_id from Step 6:

```bash
python scripts/seed_mock_shop.py --shop-id <PASTE_SHOP_ID_HERE>

# Example:
python scripts/seed_mock_shop.py --shop-id aabbccdd-eeff-0011-2233-445566778899

# Expected output:
# 🛍️  Fashion Shop Mock Data Seeder
# 📍 Target Shop ID: aabbccdd-eeff-0011-2233-445566778899
# ============================================================
# ✅ MongoDB Connected
# 
# 📦 Creating Mock Data...
# ✅ Created 4 categories
# ✅ Created 35 products
# ✅ Created inventory for 35 products
# ✅ Created 10 mock orders
# 
# 📊 Verification Report:
# ============================================================
# ✓ Products: 35
# ✓ Categories: 4
# ✓ Inventory Records: 35
# ✓ Orders: 10
# ✓ Total Stock Across Products: ~4800
# ✓ Average Product Price: ₩89,200
# ============================================================
# ✨ Mock shop data created successfully!
#    Shop ready for testing: aabbccdd-...
```

✅ **All data seeded!**

---

### **Step 8: VERIFY SETUP** (Linux Terminal - Tab 4, continued)

Run comprehensive test suite:

```bash
python scripts/verify_shop_setup.py \
  --shop-id <PASTE_SHOP_ID_HERE> \
  --api-base http://localhost:3000

# Example:
python scripts/verify_shop_setup.py \
  --shop-id aabbccdd-eeff-0011-2233-445566778899 \
  --api-base http://localhost:3000

# Expected output will show:
# ============================================================
# 🧪 SHOP INTEGRATION TEST SUITE
# ============================================================
# 
# 📍 Shop ID: aabbccdd-eeff-0011-2233-445566778899
# 🌐 API Base: http://localhost:3000
# 
# 🗄️  DATABASE TESTS
# ────────────────────────────────────────────────────────────
# ✅ Shop found: Test Fashion Shop (ACTIVE)
# ✅ Owner found: testowner@example.com (OWNER)
# ✅ Products count: 35
# ✅ Inventory records: 35
# ✅ Orders: 10
# 
# 📡 API TESTS
# ────────────────────────────────────────────────────────────
# ✅ GET /api/shops/{id} → 200
# ✅ GET /api/shops/{id}/products → 200
# ✅ GET /api/shops/{id}/categories → 200
# ✅ GET /api/shops/{id}/orders → 200
# 
# 📊 TEST RESULTS SUMMARY
# ============================================================
# ✓ Passed: 10/10
# ✗ Errors: 0
# ============================================================
```

✅ **All tests passing!**

---

### **Step 9: MANUAL VERIFICATION** (Browser)

#### **Test Admin Dashboard**

1. Open: `http://localhost:3001`
2. Login as: `testowner@example.com` / (password from shop create)
3. Navigate: Shops → "Test Fashion Shop"
4. Verify:
   - ✅ Shop name displays
   - ✅ 35 products visible
   - ✅ 4 categories in sidebar
   - ✅ No console errors (F12)

#### **Test Storefront Rendering**

1. Open: `http://localhost:3002`
2. You should see product listings (using domain detection)
3. Verify:
   - ✅ Products render with placeholder images
   - ✅ Categories visible
   - ✅ Product details load on click
   - ✅ No 404 errors

#### **Test API Directly** (curl or Postman)

```bash
# Get shop details
curl -X GET http://localhost:3000/api/shops/<shop_id> \
  -H "x-shop-id: <shop_id>" \
  -H "Content-Type: application/json"

# Get products
curl -X GET http://localhost:3000/api/shops/<shop_id>/products \
  -H "x-shop-id: <shop_id>"

# Get orders
curl -X GET http://localhost:3000/api/shops/<shop_id>/orders \
  -H "x-shop-id: <shop_id>"
```

Expected: All return 200 with JSON data ✅

---

### **Step 10: DATABASE QUERY VERIFICATION** (Optional Deep Dive)

If you have database clients installed:

#### **PostgreSQL:**

```bash
# Connect to PostgreSQL
psql -U admin -h localhost -d shop_db_1

# In psql prompt:
SELECT id, name, domain, status FROM "Shop" WHERE id = '<shop_id>';
SELECT id, email, role FROM "User" LIMIT 5;
SELECT COUNT(*) FROM "Product";
```

#### **MongoDB:**

```bash
# Connect to MongoDB
mongosh --username admin --password password --authenticationDatabase admin

# In mongosh prompt:
use ecommerce_ui
db.products.countDocuments({ shopId: "<shop_id>" })
db.orders.countDocuments({ shopId: "<shop_id>" })
db.inventory.find({ shopId: "<shop_id>" }).limit(3)
```

---

## 📋 Checklist

Use this to track progress:

```
Phase 1: Schema Fix
  ☑️ ProductLayout.productId type annotation fixed
  ☑️ TypeScript compilation successful

Phase 2: Services Started
  ☑️ PostgreSQL (5432, 5433) running
  ☑️ MongoDB (27017) running
  ☑️ API Core (3000) running
  ☑️ Admin Dashboard (3001) running
  ☑️ Storefront (3002) running

Phase 3: Shop Created
  ☑️ CLI shop create command executed
  ☑️ Shop ID recorded: _______________________
  ☑️ PostgreSQL shop record verified
  ☑️ PostgreSQL user record verified

Phase 4: Data Seeded
  ☑️ Mock products (35) created
  ☑️ Categories (4) created
  ☑️ Inventory (35 records) created
  ☑️ Orders (10) created

Phase 5: Verification
  ☑️ verify_shop_setup.py test suite passed
  ☑️ API endpoints responding (200 status)
  ☑️ Admin dashboard loads shop
  ☑️ Storefront renders products
  ☑️ Database queries return correct data
```

---

## 🐛 Troubleshooting

### **Docker won't start**
```
Error: Docker not running
→ Solution: Start Docker Desktop from Windows system tray
           Ensure WSL 2 integration is enabled
```

### **MongoDB Connection Error**
```
Error: MongoDB Connection Error: connection refused
→ Solution: Verify containers running: docker ps
           Check MongoDB port: docker logs mongodb
```

### **PostgreSQL Connection Error**
```
Error: psycopg2.OperationalError: connection refused
→ Solution: Verify containers running: docker ps
           Check credentials in DATABASE_URL match docker-compose.yaml
```

### **API Core fails to start**
```
Error: CannotDetermineTypeError
→ Solution: Already fixed! The schema was updated
           If still occurring, rebuild: npm run build
```

### **Shop creation fails**
```
Error: Shop create command returns error
→ Solution: Check all 3 databases running
           Verify credentials in environment
           Check PostgreSQL/MongoDB connectivity before running CLI
```

### **Verify script shows 0 tests passing**
```
Error: API responds with 500 errors
→ Solution: Check API Core console for errors
           Verify multi-tenancy header: x-shop-id must match shop_id
           Check databases contain data from steps 6-7
```

---

## 🚀 Production Considerations

**For Vercel + Cloudflare Tunnel deployment:**

1. **Vercel (Admin + Storefront)**
   - Builds and deploys every push to `main`
   - Environment: Uses production API base URL via Cloudflare tunnel
   - Configuration: `apps/admin/vercel.json` and `apps/storefront/vercel.json`

2. **Cloudflare Tunnel (API Core)**
   - Exposes `api.yourdomain.com` → localhost:3000
   - Setup: `setup-cloudflare-tunnel.sh` (already prepared)
   - Credentials stored in Azure Key Vault

3. **Database Migration**
   - PostgreSQL: RDS (AWS/Azure)
   - MongoDB: Atlas (MongoDB Cloud)
   - Configuration: Update `DATABASE_URL` and `MONGODB_URI` in `.env`

---

## 📝 Notes

- **Dev environment**: Uses localhost with port-based routing
- **Mock images**: Placeholder URLs from Unsplash (no storage needed)
- **Multi-tenancy**: Enforced via `x-shop-id` header and AsyncLocalStorage in API Core
- **Audit logging**: All CLI operations logged to `~/.ecommerce-cli/audit.log`
- **Backup created**: Before any deletion, automatic backup created to `~/.ecommerce-cli/backups/{shop_id}/`

---

## ✅ Success Criteria

You've completed this when:

1. ✅ All 3 services running without errors
2. ✅ Shop created via CLI with shop_id
3. ✅ 35+ products, 4 categories, 10 orders visible in MongoDB
4. ✅ All API endpoints return 200 status
5. ✅ Admin dashboard loads and displays shop
6. ✅ Storefront renders products with placeholder images
7. ✅ Database queries confirm data integrity
8. ✅ verify_shop_setup.py shows 10/10 tests passing

---

**Next**: Once verified locally, plan deployment to Vercel + Cloudflare Tunnel.
