# E-commerce Platform - `api-core`

This is the core backend service for the multi-tenant E-commerce platform, built with **NestJS**. It acts as the central hub for data management, analytics, tenant shops, and business logic.

---

## 📚 API Catalog & Testing Guide (Postman / cURL)

Below is the complete list of all available REST endpoints exposed by `api-core`. You can copy the provided `curl` commands and paste them directly into Postman (Import -> Raw text) or run them in your terminal.

> **💡 Authentication Note**: 
> Endpoints marked with 🔒 require an active user session. Depending on your BetterAuth setup, this might be a cookie or a token. The examples assume a Bearer token if needed, or rely on existing session cookies if running from a browser environment.
> Default host is assumed to be `http://localhost:3001`.

### 1. 📊 Analytics (`/analytics`)

#### Get Master Summary (Platform-wide)
Retrieves high-level metrics for the entire platform (Super Admin).
```bash
curl -X GET http://localhost:3001/analytics/master-summary
```

#### Get Master Charts (Platform-wide)
Retrieves time-series data for the master dashboard.
```bash
curl -X GET http://localhost:3001/analytics/master-charts
```

#### Get Shop Summary
Retrieves specific metrics for an individual shop.
```bash
curl -X GET http://localhost:3001/analytics/shop/SHOP_ID_HERE/summary
```

#### Get Shop Charts
Retrieves time-series and distribution data for an individual shop.
```bash
curl -X GET http://localhost:3001/analytics/shop/SHOP_ID_HERE/charts
```

---

### 2. 🔐 Auth (`/api/auth`)

#### Get Current User Profile 🔒
Get details of the currently authenticated user.
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Change Username 🔒
Update the authenticated user's display name.
```bash
curl -X PUT http://localhost:3001/api/auth/change-username \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"newName": "New User Name"}'
```

---

### 3. 👥 Customer (`/api/customers`)

#### Subscribe Newsletter
Subscribe a customer email to the shop's mailing list.
```bash
curl -X POST http://localhost:3001/api/customers/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "shopId": "SHOP_ID_HERE"}'
```

---

### 4. 🎨 Layout (`/api/layouts` & `/api/storefront`)

#### Get Published Layout for Storefront
Fetch the compiled JSON layout for a specific tenant domain (used by Next.js Front-end).
```bash
curl -X GET http://localhost:3001/api/storefront/shop.yourdomain.com/layout
```

#### Publish Shop Layout 🔒
Save and publish a new drag-and-drop layout configuration for a shop.
```bash
curl -X POST http://localhost:3001/api/layouts/publish \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"shopId": "SHOP_ID_HERE", "nodes": [], "theme": {}}'
```

#### Get Compiled Layout By Shop ID
Fetch the raw layout JSON by shop ID.
```bash
curl -X GET http://localhost:3001/api/layouts/SHOP_ID_HERE
```

---

### 5. 🛒 Order (`/api/orders`)

#### Create Order (Checkout)
Place a new order on a specific shop.
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "SHOP_ID_HERE",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "123456789",
    "shippingAddress": "123 Main St",
    "items": [
      {
        "productId": "PROD_ID_HERE",
        "variantId": "VARIANT_ID_HERE",
        "quantity": 2,
        "price": 50000
      }
    ],
    "totalAmount": 100000
  }'
```

#### Get Order Details
Retrieve specific order information.
```bash
curl -X GET http://localhost:3001/api/orders/ORDER_ID_HERE
```

---

### 6. 📦 Product (`/api/products`)

#### Create Product 🔒
Create a new product with default variant and stock.
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "SHOP_ID_HERE",
    "name": "New Awesome Product",
    "description": "Product detailed description",
    "price": 150000,
    "stock": 100,
    "images": ["url1.jpg", "url2.jpg"]
  }'
```

#### Get Shop Products
List products for a specific shop (with optional limit).
```bash
curl -X GET "http://localhost:3001/api/products/shop/SHOP_ID_HERE?limit=20"
```

#### Get Product Detail
Get full details of a specific product.
```bash
curl -X GET http://localhost:3001/api/products/PRODUCT_ID_HERE
```

#### Update Product 🔒
Update product details.
```bash
curl -X PUT http://localhost:3001/api/products/PRODUCT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Format Name",
    "price": 160000
  }'
```

---

### 7. 🏪 Shop (`/api/shops`)

#### Create Shop 🔒
Register a new tenant shop for the authenticated user.
```bash
curl -X POST http://localhost:3001/api/shops \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Store",
    "domain": "mystore.ecommerce.local"
  }'
```

#### Get My Shops 🔒
Retrieve a list of shops owned by the authenticated user.
```bash
curl -X GET http://localhost:3001/api/shops/my-shops \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get All Platform Shops (Admin)
List all registered shops on the platform.
```bash
curl -X GET http://localhost:3001/api/shops/system/all-shops
```

#### Get Shop Settings
Get settings and metadata for a specific shop.
```bash
curl -X GET http://localhost:3001/api/shops/SHOP_ID_HERE
```

#### Update Shop Settings 🔒
Modify shop metadata (name, domain, active status).
```bash
curl -X PUT http://localhost:3001/api/shops/SHOP_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Store Name"
  }'
```

---

### 8. ⚙️ System (`/api/system`)

#### System Health Check
Verify API uptime and database connectivity.
```bash
curl -X GET http://localhost:3001/api/system/health
```

#### Validate JSON Setup
Check if a payload matches the required layout schema.
```bash
curl -X POST http://localhost:3001/api/system/validate-json \
  -H "Content-Type: application/json" \
  -d '{"jsonConfig": "{...}"}'
```

#### Mass Sync Feature (Internal)
Utility to sync data models across shards/tenants.
```bash
curl -X POST http://localhost:3001/api/system/mass-sync \
  -H "Content-Type: application/json" \
  -d '{"targetAttr": "featureFlags", "newValue": "on"}'
```
