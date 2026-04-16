# 📮 Postman Collections Setup Guide — ShopVolo v2 API Testing

**Location**: `/apps/api-core/postman/`  
**Status**: Setup & Testing Guide  
**Last Updated**: April 16, 2026

---

## Overview

This guide walks through setting up and running Postman collections to test the ShopVolo v2 API Core endpoints. Two collections are used:

1. **cache-testing.postman_collection.json** — Validates internal caching behavior
2. **shopvolo-usecases.postman_collection.json** — Tests all 10 ShopVolo use-cases

---

## Part 1: Prerequisites

### Required
- ✅ Postman (Desktop or Cloud) — installed on WSL or your machine
- ✅ API Core running on `http://localhost:3000`
- ✅ `.env` configured with database credentials (Supabase + MongoDB Atlas)
- ✅ Postman Collections files downloaded (or being created)

### Verify API Core is Running
```bash
curl http://localhost:3000/health
# Expected: 200 OK with {"status": "ok"}
```

---

## Part 2: Cache Testing Collection (Phase 3a)

### Step 1: Import Existing Collection

1. **Open Postman**
2. **Click "Import"** (top-left)
3. **Select file**: `/home/troll/workspaces/ecommerce-platform/apps/api-core/postman/cache-testing.postman_collection.json`
4. **Click "Import"**

### Step 2: Create Environment

1. **Click Environments** (left sidebar)
2. **Click "+"** to create new environment
3. **Name**: `ShopVolo Dev`
4. **Variables**:
   ```
   baseUrl          = http://localhost:3000
   tenantId         = shop123
   timeout          = 5000
   cacheThreshold   = 10
   ```
5. **Save**

### Step 3: Select Environment & Run Tests

1. **Top-right**: Select environment `ShopVolo Dev`
2. **In collection**: Click `cache-testing` → **Run** (▶ button)
3. **Order**: Sequential (default)
4. **Expected Results**:
   - ✅ **Test 1**: GET Layout (cold cache) — response time varies
   - ✅ **Test 2**: GET Layout (warm cache) — response time **< 10ms**
   - ✅ **Test 3**: POST Publish Layout — cache invalidated
   - ✅ **Test 4**: GET Layout (new data) — returns updated data

### Step 4: Validate Response Times

After each test run, check:
- Status: All `200 OK`
- Response times:
  - Cold cache: `50–500ms` (acceptable)
  - Warm cache: `< 10ms` (cache working!)
  - Publish: `100–300ms` (API processing)
  - Post-invalidate: `50–500ms` (cache cleared, fresh fetch)

**✅ Phase 3a PASSED** if warm cache is consistently < 10ms.

---

## Part 3: ShopVolo Use-cases Collection (Phase 3b) — Manual Setup

### Prerequisite: Phase 3a Must Pass
Do not proceed until cache testing validates successfully.

### Overview

We'll create a new Postman collection called `shopvolo-usecases.postman_collection.json` containing:
- **10 folders** (one per use-case, UC-01 through UC-10)
- **Sample requests** for each use-case with realistic test data
- **Tests** tab in each request to validate responses
- **Environment variables** for multi-tenancy scoping

### Step 1: Create New Collection

1. **In Postman**: Click **"+"** (New tab)
2. **Select**: Create new → **Collection**
3. **Name**: `ShopVolo Use-cases`
4. **Description**: `Tests for all 10 ShopVolo v2 use-cases (UC-01 to UC-10)`
5. **Click Create**

### Step 2: Add Folders for Each Use-case

For each UC (UC-01 through UC-10), create a folder:

1. **Right-click** on collection
2. **Add Folder**
3. **Name**: `UC-01: Onboarding`, `UC-02: Master Templates`, etc.
4. **Save**

You should now have:
```
ShopVolo Use-cases/
├── UC-01: Onboarding
├── UC-02: Master Templates
├── UC-03: Branding
├── UC-04: Product Management
├── UC-05: Navigation
├── UC-06: Custom Pages
├── UC-07: Dynamic Browsing
├── UC-08: Cart Management
├── UC-09: Checkout & Orders
└── UC-10: Domain Mapping
```

### Step 3: Add Requests for Each Use-case

#### **UC-01: Onboarding** — `POST /api/v1/tenants/register`

1. **Folder**: UC-01
2. **New Request**: `Register New Shop`
3. **Method**: POST
4. **URL**: `{{baseUrl}}/api/v1/tenants/register`
5. **Headers**:
   ```
   Content-Type: application/json
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "shopName": "TechGear Store",
     "email": "owner@techgear.com",
     "domain": "techgear.example.com",
     "ownerName": "John Doe"
   }
   ```
7. **Tests Tab** (copy-paste):
   ```javascript
   pm.test("Status code is 200", function() {
     pm.response.to.have.status(200);
   });
   
   pm.test("Response has tenantId", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property('tenantId');
     pm.expect(jsonData.status).to.equal('active');
   });
   
   pm.test("Response time < 500ms", function() {
     pm.expect(pm.response.responseTime).to.be.below(500);
   });
   
   // Save tenantId to environment for later tests
   var jsonData = pm.response.json();
   pm.environment.set("generatedTenantId", jsonData.tenantId);
   ```
8. **Save**

#### **UC-02: Master Templates** — `POST /api/v1/admin/templates`

1. **Folder**: UC-02
2. **New Request**: `Create Master Template`
3. **Method**: POST
4. **URL**: `{{baseUrl}}/api/v1/admin/templates`
5. **Headers**:
   ```
   Content-Type: application/json
   Authorization: Bearer {{adminToken}}
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "name": "Minimalist Tech",
     "version": "1.0.0",
     "layout": {
       "header": {
         "slots": [
           {
             "id": "logo",
             "position": "left",
             "type": "image"
           },
           {
             "id": "navigation",
             "position": "center",
             "type": "menu"
           },
           {
             "id": "cart",
             "position": "right",
             "type": "icon"
           }
         ]
       },
       "footer": {
         "slots": [
           {
             "id": "copyright",
             "position": "center",
             "type": "text"
           }
         ]
       }
     },
     "defaultStyles": {
       "colors": {
         "primary": "#000000",
         "secondary": "#FFFFFF",
         "accent": "#FF6B6B"
       },
       "typography": {
         "fontFamily": "Inter, sans-serif",
         "fontSize": "16px"
       }
     }
   }
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 200 or 201", function() {
     pm.expect([200, 201]).to.include(pm.response.code);
   });
   
   pm.test("Response has templateId and version", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property('templateId');
     pm.expect(jsonData.version).to.equal('1.0.0');
   });
   ```
8. **Save**

#### **UC-03: Branding** — `PATCH /api/v1/tenants/{tenantId}/config`

1. **Folder**: UC-03
2. **New Request**: `Update Shop Branding`
3. **Method**: PATCH
4. **URL**: `{{baseUrl}}/api/v1/tenants/{{tenantId}}/config`
5. **Headers**:
   ```
   Content-Type: application/json
   x-tenant-id: {{tenantId}}
   Authorization: Bearer {{authToken}}
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "branding": {
       "logo": "https://example.com/logo.png",
       "colors": {
         "primary": "#FF6B6B",
         "secondary": "#FFE66D"
       },
       "typography": {
         "fontFamily": "Poppins, sans-serif"
       }
     }
   }
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 200", function() {
     pm.response.to.have.status(200);
   });
   
   pm.test("Branding updated", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData.config.branding.colors.primary).to.equal('#FF6B6B');
   });
   ```
8. **Save**

#### **UC-04: Product Management** — `POST /api/v1/products`

1. **Folder**: UC-04
2. **New Request**: `Create Product`
3. **Method**: POST
4. **URL**: `{{baseUrl}}/api/v1/products`
5. **Headers**:
   ```
   Content-Type: application/json
   x-tenant-id: {{tenantId}}
   Authorization: Bearer {{authToken}}
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "name": "Wireless Bluetooth Headphones",
     "description": "Premium noise-canceling headphones with 30-hour battery",
     "price": 199.99,
     "sku": "WBH-001",
     "images": [
       "https://example.com/product1.jpg",
       "https://example.com/product2.jpg"
     ]
   }
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 201", function() {
     pm.response.to.have.status(201);
   });
   
   pm.test("Product has ID and images processed", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property('productId');
     pm.expect(jsonData.images).to.have.property('subject');
     pm.expect(jsonData.images).to.have.property('thumbnails');
   });
   ```
8. **Save**

#### **UC-05: Navigation** — `PATCH /api/v1/tenants/{tenantId}/navigation`

1. **Folder**: UC-05
2. **New Request**: `Setup Navigation`
3. **Method**: PATCH
4. **URL**: `{{baseUrl}}/api/v1/tenants/{{tenantId}}/navigation`
5. **Headers**:
   ```
   Content-Type: application/json
   x-tenant-id: {{tenantId}}
   Authorization: Bearer {{authToken}}
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "header": [
       {
         "label": "Home",
         "url": "/",
         "icon": "home"
       },
       {
         "label": "Products",
         "url": "/products",
         "children": [
           {
             "label": "Electronics",
             "url": "/products?category=electronics"
           },
           {
             "label": "Accessories",
             "url": "/products?category=accessories"
           }
         ]
       },
       {
         "label": "About",
         "url": "/about",
         "icon": "info"
       }
     ],
     "footer": [
       {
         "label": "Privacy Policy",
         "url": "/privacy"
       },
       {
         "label": "Terms of Service",
         "url": "/terms"
       }
     ]
   }
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 200", function() {
     pm.response.to.have.status(200);
   });
   
   pm.test("Navigation has header and footer", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData.navigation).to.have.property('header');
     pm.expect(jsonData.navigation).to.have.property('footer');
   });
   ```
8. **Save**

#### **UC-06: Custom Pages** — `POST /api/v1/pages`

1. **Folder**: UC-06
2. **New Request**: `Create About Page`
3. **Method**: POST
4. **URL**: `{{baseUrl}}/api/v1/pages`
5. **Headers**:
   ```
   Content-Type: application/json
   x-tenant-id: {{tenantId}}
   Authorization: Bearer {{authToken}}
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "title": "About Us",
     "slug": "about-us",
     "content": "# About Our Company\n\nWe are passionate about delivering quality products...",
     "templateId": "default",
     "seo": {
       "metaTitle": "About Us — TechGear Store",
       "metaDescription": "Learn about our company mission and values"
     }
   }
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 201", function() {
     pm.response.to.have.status(201);
   });
   
   pm.test("Page URL is generated", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property('url');
     pm.expect(jsonData.slug).to.equal('about-us');
   });
   ```
8. **Save**

#### **UC-07: Dynamic Browsing** — `GET /api/v1/storefront/config`

1. **Folder**: UC-07
2. **New Request**: `Get Storefront Config`
3. **Method**: GET
4. **URL**: `{{baseUrl}}/api/v1/storefront/config?domain=shop.example.com`
5. **Headers**:
   ```
   x-request-id: {{$randomUUID}}
   ```
6. **Params**:
   ```
   domain = shop.example.com
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 200", function() {
     pm.response.to.have.status(200);
   });
   
   pm.test("Response has merged layout with branding", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property('layout');
     pm.expect(jsonData).to.have.property('branding');
     pm.expect(jsonData).to.have.property('navigation');
   });
   
   pm.test("Response time < 10ms (cached)", function() {
     pm.expect(pm.response.responseTime).to.be.below(10);
   });
   ```
8. **Save**

#### **UC-08: Cart Management** — `POST /api/v1/carts/{cartId}/items`

1. **Folder**: UC-08
2. **New Request**: `Add to Cart`
3. **Method**: POST
4. **URL**: `{{baseUrl}}/api/v1/carts/cart123/items`
5. **Headers**:
   ```
   Content-Type: application/json
   x-tenant-id: {{tenantId}}
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "productId": "prod-001",
     "quantity": 2
   }
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 200 or 201", function() {
     pm.expect([200, 201]).to.include(pm.response.code);
   });
   
   pm.test("Cart updated with item", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData.items.length).to.be.greaterThan(0);
     pm.expect(jsonData).to.have.property('total');
   });
   ```
8. **Save**

#### **UC-09: Checkout & Orders** — `POST /api/v1/orders`

1. **Folder**: UC-09
2. **New Request**: `Create Order`
3. **Method**: POST
4. **URL**: `{{baseUrl}}/api/v1/orders`
5. **Headers**:
   ```
   Content-Type: application/json
   x-tenant-id: {{tenantId}}
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "cartId": "cart123",
     "shippingAddress": {
       "street": "123 Main Street",
       "city": "San Francisco",
       "state": "CA",
       "zipCode": "94102",
       "country": "US"
     },
     "paymentMethod": "stripe",
     "paymentToken": "tok_visa_4242"
   }
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 201", function() {
     pm.response.to.have.status(201);
   });
   
   pm.test("Order created with ID and status", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property('orderId');
     pm.expect(jsonData.status).to.equal('pending');
     pm.expect(jsonData).to.have.property('total');
   });
   ```
8. **Save**

#### **UC-10: Domain Mapping** — `POST /api/v1/tenants/{tenantId}/domains`

1. **Folder**: UC-10
2. **New Request**: `Add Custom Domain`
3. **Method**: POST
4. **URL**: `{{baseUrl}}/api/v1/tenants/{{tenantId}}/domains`
5. **Headers**:
   ```
   Content-Type: application/json
   x-tenant-id: {{tenantId}}
   Authorization: Bearer {{authToken}}
   x-request-id: {{$randomUUID}}
   ```
6. **Body** (JSON):
   ```json
   {
     "domain": "shop.mycompany.com",
     "dnsRecord": "CNAME shop-volo.example.com"
   }
   ```
7. **Tests Tab**:
   ```javascript
   pm.test("Status code is 200 or 201", function() {
     pm.expect([200, 201]).to.include(pm.response.code);
   });
   
   pm.test("Domain pending verification", function() {
     var jsonData = pm.response.json();
     pm.expect(jsonData.status).to.equal('pending_verification');
     pm.expect(jsonData).to.have.property('verificationCode');
   });
   ```
8. **Save**

### Step 4: Environment Variables Setup

1. **Postman Settings** → **Environments**
2. **Edit** `ShopVolo Dev` environment
3. **Add/Update Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `baseUrl` | `http://localhost:3000` | API Core endpoint |
| `tenantId` | `shop123` | Default shop for testing |
| `authToken` | `(empty)` | Will be generated via login request |
| `adminToken` | `(empty)` | For super admin operations |
| `timeout` | `5000` | Milliseconds |
| `cacheThreshold` | `10` | Expected cache response time (ms) |

4. **Save**

### Step 5: Test All Use-cases

1. **In collection**: Select `ShopVolo Use-cases`
2. **Click Run** (▶ button) or **Runner**
3. **Configure**:
   - Environment: `ShopVolo Dev`
   - Delays: 500ms (between requests)
   - Data: (leave empty unless using CSV)
4. **Run**

### Expected Results

After running all 10 use-cases:
- ✅ UC-01: `200/201` — New shop created
- ✅ UC-02: `200/201` — Template defined
- ✅ UC-03: `200` — Branding applied
- ✅ UC-04: `201` — Product created with image processing
- ✅ UC-05: `200` — Navigation configured
- ✅ UC-06: `201` — Custom page created
- ✅ UC-07: `200` — Storefront config (merged) retrieved, response < 10ms
- ✅ UC-08: `200/201` — Item added to cart
- ✅ UC-09: `201` — Order created
- ✅ UC-10: `200/201` — Domain mapping created

**✅ Phase 3b PASSED** if all 10 use-cases return expected status codes and response structures.

---

## Part 4: Save Collections to Repository

### Step 1: Export Cache Testing Collection

1. **In Postman**: Hover over `API Caching Tests` (cache-testing collection)
2. **Click "..."** → **Export**
3. **Format**: JSON (Postman Collection v2.1)
4. **Save to**: `/home/troll/workspaces/ecommerce-platform/apps/api-core/postman/cache-testing.postman_collection.json`

### Step 2: Export ShopVolo Use-cases Collection

1. **In Postman**: Hover over `ShopVolo Use-cases`
2. **Click "..."** → **Export**
3. **Format**: JSON (Postman Collection v2.1)
4. **Save to**: `/home/troll/workspaces/ecommerce-platform/apps/api-core/postman/shopvolo-usecases.postman_collection.json`

### Step 3: Commit to Git

```bash
cd /home/troll/workspaces/ecommerce-platform

git add apps/api-core/postman/
git commit -m "docs: add ShopVolo v2 use-case Postman collection (UC-01 to UC-10)"
git push origin retry  # or your branch
```

---

## Part 5: Troubleshooting

### Issue: Collection won't import

**Solution**: Ensure the `.json` file is valid (use jsonlint.com to check format)

### Issue: "404 Not Found" on requests

**Solution**: 
- Verify API Core is running: `curl http://localhost:3000/health`
- Check `baseUrl` environment variable matches your API address
- Verify endpoint paths match API Core's routing

### Issue: "401 Unauthorized"

**Solution**: 
- Auth endpoints might not be implemented yet
- Remove `Authorization` header for testing phase
- Set up `/auth/login` endpoint first if required

### Issue: Warm cache response is NOT < 10ms

**Solution**:
- Cache might be disabled in API Core
- Check Redis connection in API Core logs
- Verify `@CacheKey` decorators are used in controllers

### Issue: Multi-tenant isolation failing (shop123 seeing shop456 data)

**Solution**:
- Verify `TenantInterceptor` is active in API Core
- Ensure `x-tenant-id` header is being sent
- Check `AsyncLocalStorage` setup in NestJS main.ts

---

## Summary Checklist

- [ ] **Phase 3a**: Cache testing collection imported, all 4 tests pass
- [ ] **Phase 3a**: Warm cache response consistently < 10ms
- [ ] **Phase 3b**: ShopVolo use-cases collection created (10 folders)
- [ ] **Phase 3b**: All 10 requests added with test tabs
- [ ] **Phase 3b**: Environment variables configured
- [ ] **Phase 3b**: All 10 use-cases run successfully
- [ ] **Phase 3b**: Responses validated against schema
- [ ] **Collections**: Both `.json` files saved to `apps/api-core/postman/`
- [ ] **Git**: Changes committed with conventional commit message

---

## Next Steps

1. **Once Phase 3a & 3b pass**: Document any failing endpoints
2. **Implement missing API routes** in API Core (if needed)
3. **Run collection** on each code change to catch regressions
4. **Add to CI/CD**: Consider Newman (Postman CLI) for automated API testing

---

**Questions?** Check [.agents/SHOPVOLO_V2_SPEC.md](.agents/SHOPVOLO_V2_SPEC.md) for technical details on each use-case, or open an issue.

*Created: April 16, 2026 | Last Updated: April 16, 2026*
