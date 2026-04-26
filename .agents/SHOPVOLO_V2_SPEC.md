# 🏪 Đặc tả Tác nhân và Use-case - Dự án ShopVolo v2

**Version**: 1.0  
**Last Updated**: April 16, 2026  
**Status**: Development Planning  

---

## 1. Tổng quan dự án

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Tên dự án** | ShopVolo v2 |
| **Mô hình kinh doanh** | Multi-tenant SaaS (E-commerce) |
| **Kiến trúc** | Zero-file, Dynamic Rendering (Next.js + NestJS) |
| **Mục tiêu hạ tầng** | Vận hành 20.000 shop trên hạ tầng 6GB RAM (WSL2) |
| **Backend** | NestJS + Prisma (PostgreSQL) + Mongoose (MongoDB) |
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS |
| **Lưu trữ** | MinIO (object storage) cho hình ảnh |
| **Caching** | Redis (in-memory) + HTTP cache headers |

---

## 2. Các Tác nhân (Actors)

| Tác nhân | Mô tả vai trò | Quyền hạn |
| :--- | :--- | :--- |
| **Super Admin** | Quản lý nền tảng. Chịu trách nhiệm thiết kế và bảo trì các **Master Templates** gốc. | Tạo/sửa/xóa templates, quản lý toàn nền tảng |
| **Tenant Owner** | Chủ cửa hàng (Người thuê). Quản lý sản phẩm, tùy biến giao diện và xử lý đơn hàng. | Quản lý shop của riêng mình, đó không bao gồm các shop khác |
| **End Customer** | Khách mua hàng. Duyệt sản phẩm, đặt hàng và thanh toán trên shop của Tenant. | Xem công khai, giỏ hàng, checkout |
| **System/Cron** | Tác vụ tự động. Xử lý ảnh (tách lớp), dọn dẹp cache và đồng bộ dữ liệu hệ thống. | Tự động: xử lý ảnh, cache invalidation, backups |

---

## 3. Danh sách 10 Use-cases Chính

### UC-01: Khởi tạo Shop (Onboarding)

**Tác nhân**: Tenant Owner  
**Mô tả**: Đăng ký và tạo cửa hàng mới  
**Luồng chính**:
1. Người dùng gửi yêu cầu đăng ký với: tên shop, email, domain
2. Hệ thống kiểm tra domain có trùng lặp không
3. Tạo tenant mới, gán default Master Template
4. Tạo admin account cho shop owner
5. Gửi email xác nhận

**Logic API**:

**Endpoint**: `POST /api/v1/tenants/register`

**Request Body**:
```json
{
  "shopName": "string (required, min 1 char, max 255)",
  "email": "string (required, valid email format)",
  "domain": "string (required, min 3 chars, max 63, DNS-safe)",
  "ownerName": "string (required, min 1 char, max 255)"
}
```

**Success Response** (HTTP 201):
```json
{
  "code": "1000",
  "message": "OK",
  "data": {
    "tenantId": "uuid",
    "shopName": "string",
    "domain": "string",
    "email": "string",
    "ownerName": "string",
    "status": "active",
    "createdAt": "ISO8601"
  }
}
```

**Error Responses**:

| HTTP | Code | Trường hợp | Message |
|------|------|-----------|---------|
| 400 | 1002 | Thiếu trường bắt buộc | `"shopName", "email", "domain", or "ownerName" is required` |
| 400 | 1003 | Email không hợp lệ | `Invalid email format` |
| 400 | 1004 | Domain không hợp lệ (ký tự đặc biệt, chiều dài) | `Invalid domain format` |
| 409 | 1013 | Domain đã tồn tại | `Domain already exists` |
| 409 | 9996 | Email đã đăng ký | `Email already registered` |
| 500 | 1001 | Lỗi database | `Database connection error` |
| 500 | 9999 | Lỗi hệ thống không xác định | `Exception occurred` |

**Backward Compatibility Strategy**:
- New endpoint: `POST /api/v1/tenants/register` (UC-01 spec-compliant)
- Keep old endpoint: `POST /api/shops` as alias/wrapper to new endpoint for 2-3 releases
- Old endpoint response: Map to new format but mark with `deprecationWarning: true` in response headers
- Migration period: 2-3 releases; remove old endpoint in v2.1

---

### UC-02: Quản lý Master Template

**Tác nhân**: Super Admin  
**Mô tả**: Định nghĩa các bộ khung giao diện (Visual, Technical, Service...)  
**Luồng chính**:
1. Admin thiết kế template với: layout slots, colors, typography
2. Định nghĩa các "Slots" (vị trí có thể tùy biến)
3. Thiết lập default CSS classes
4. Lưu template với version control
5. Gán template mặc định cho shop mới

**Logic API**:
```
POST /api/v1/admin/templates
Body: {
  "name": "string",
  "version": "string",
  "layout": {
    "header": { "slots": [...] },
    "footer": { "slots": [...] },
    "sidebar": { "slots": [...] }
  },
  "defaultStyles": {
    "colors": { "primary": "#000000" },
    "typography": { "fontFamily": "sans-serif" }
  }
}

Response: {
  "templateId": "uuid",
  "name": "string",
  "version": "string",
  "createdAt": "ISO8601"
}
```

---

### UC-03: Tùy biến thương hiệu (Branding)

**Tác nhân**: Tenant Owner  
**Mô tả**: Thay đổi Logo, màu sắc, font chữ của shop  
**Luồng chính**:
1. Shop owner tải lên logo hoặc chỉnh sửa màu sắc
2. Hệ thống lưu các "overrides" (chỉ lưu giá trị khác với master template)
3. Preview giao diện với tùy biến mới
4. Lưu cấu hình, invalidate cache
5. Giao diện live update

**Logic API**:
```
PATCH /api/v1/tenants/{tenantId}/config
Body: {
  "branding": {
    "logo": "url",
    "colors": {
      "primary": "#FF0000",
      "secondary": "#00FF00"
    },
    "typography": {
      "fontFamily": "Roboto"
    }
  }
}

Response: {
  "tenantId": "uuid",
  "config": { "branding": {...} },
  "lastModified": "ISO8601"
}
```

---

### UC-04: Quản lý Sản phẩm (Product Management)

**Tác nhân**: Tenant Owner  
**Mô tả**: Quản lý kho sản phẩm và hình ảnh  
**Luồng chính**:
1. Shop owner tạo sản phẩm: tên, mô tả, giá, SKU
2. Upload ảnh sản phẩm (có background)
3. Hệ thống: Tách biệt Subject (PNG) và Background (JPG) bằng AI/Cron
4. Tạo thumbnails (3 kích thước: mobile/tablet/desktop)
5. Lưu metadata vào MongoDB, URLs vào MinIO

**Logic API**:
```
POST /api/v1/products
Body: {
  "name": "string",
  "description": "string",
  "price": "number",
  "sku": "string",
  "images": ["file_url", ...]
}

Response: {
  "productId": "uuid",
  "name": "string",
  "images": {
    "subject": "url",
    "background": "url",
    "thumbnails": { "mobile": "url", "tablet": "url", "desktop": "url" }
  },
  "createdAt": "ISO8601"
}
```

---

### UC-05: Thiết lập Điều hướng (Navigation)

**Tác nhân**: Tenant Owner  
**Mô tả**: Xây dựng cấu trúc Menu Header/Footer  
**Luồng chính**:
1. Shop owner định nghĩa menu items: URL, label, icon
2. Cấu hình menu cho header, footer, sidebar
3. Hỗ trợ nested menu (dropdown)
4. Lưu JSON vào config
5. Frontend render navigation từ JSON

**Logic API**:
```
PATCH /api/v1/tenants/{tenantId}/navigation
Body: {
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
        { "label": "Electronics", "url": "/products?category=electronics" }
      ]
    }
  ],
  "footer": [...]
}

Response: {
  "tenantId": "uuid",
  "navigation": { "header": [...], "footer": [...] },
  "lastModified": "ISO8601"
}
```

---

### UC-06: Tạo trang nội dung động (Custom Pages)

**Tác nhân**: Tenant Owner  
**Mô tả**: Tạo thêm các trang như Chính sách, Giới thiệu  
**Luồng chính**:
1. Shop owner tạo trang mới: title, slug, content (Markdown)
2. Chọn template layout (từ master template)
3. Hệ thống render trang bằng Universal Renderer
4. Lưu content vào MongoDB (flexible schema)
5. Frontend fetches layout + content, đổ vào template

**Logic API**:
```
POST /api/v1/pages
Body: {
  "title": "About Us",
  "slug": "about-us",
  "content": "# About Us\nThis is our story...",
  "templateId": "uuid",
  "seo": {
    "metaTitle": "About Us",
    "metaDescription": "Learn about our company"
  }
}

Response: {
  "pageId": "uuid",
  "slug": "about-us",
  "url": "https://shop.example.com/about-us",
  "createdAt": "ISO8601"
}
```

---

### UC-07: Duyệt sản phẩm động (Dynamic Browsing)

**Tác nhân**: End Customer  
**Mô tả**: Truy cập shop và xem giao diện được render theo thời gian thực  
**Luồng chính**:
1. Khách truy cập: `https://shop-domain.com/`
2. Frontend gửi request: `GET /api/v1/storefront/config?domain={host}`
3. API Core tìm tenant dựa vào domain
4. Thực hiện phép hợp: **Master Template + Tenant Config** (deep merge)
5. Trả về full layout JSON
6. Frontend render giao diện từ JSON, fetch products

**Logic API**:
```
GET /api/v1/storefront/config?domain=shop.example.com

Response: {
  "tenantId": "uuid",
  "layout": {
    // Master Template merged with Tenant Overrides
    "header": { "slots": [...] },
    "footer": { "slots": [...] }
  },
  "branding": {
    "colors": { "primary": "#..." },
    "logo": "url"
  },
  "navigation": { "header": [...] },
  "pages": [...]
}
```

**Caching Strategy**:
- Response cached in Redis với TTL = 1 giờ
- Cache key: `storefront:config:{tenantId}`
- Invalidate on: tenant config change, template update, product add/remove

---

### UC-08: Quản lý Giỏ hàng (Cart)

**Tác nhân**: End Customer  
**Mô tả**: Quản lý danh sách mặt hàng dự định mua  
**Luồng chính**:
1. Khách thêm sản phẩm vào giỏ (click "Add to Cart")
2. Lưu giỏ **Client-side** (localStorage) hoặc **Server-side** (nếu đã login)
3. Cập nhật số lượng, xóa items
4. Tính tổng tiền, áp dụng coupon
5. Chuyển giỏ sang checkout

**Logic API** (nếu server-side):
```
POST /api/v1/carts/{cartId}/items
Body: {
  "productId": "uuid",
  "quantity": 2
}

Response: {
  "cartId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 100.00,
      "subtotal": 200.00
    }
  ],
  "total": 200.00
}
```

---

### UC-09: Thanh toán & Đơn hàng (Checkout)

**Tác nhân**: End Customer  
**Mô tả**: Thực hiện thanh toán và chốt đơn  
**Luồng chính**:
1. Khách nhập thông tin giao hàng (address, phone, email)
2. Chọn phương thức thanh toán (Stripe, PayPal, COD)
3. API Core gọi Payment Gateway
4. Gateway trả về result (success/failed)
5. Nếu thành công: tạo Order record, update inventory
6. Gửi email confirmation tới khách + shop owner
7. Cập nhật dashboard của shop owner

**Logic API**:
```
POST /api/v1/orders
Body: {
  "cartId": "uuid",
  "shippingAddress": { "street": "...", "city": "...", "country": "..." },
  "paymentMethod": "stripe",
  "paymentToken": "token_from_stripe"
}

Response: {
  "orderId": "uuid",
  "status": "pending",
  "total": 200.00,
  "items": [...],
  "createdAt": "ISO8601"
}
```

**Webhook Flow**:
```
Payment Gateway → /api/v1/webhooks/payment-success
  ↓
API Core verifies signature
  ↓
Update Order status → "confirmed"
  ↓
Emit event: "order.created" → send emails
```

---

### UC-10: Ánh xạ Tên miền (Domain Mapping)

**Tác nhân**: Tenant Owner / System  
**Mô tả**: Kết nối Domain riêng vào ID cửa hàng  
**Luồng chính**:
1. Shop owner yêu cầu custom domain (e.g., `shop.mycompany.com`)
2. Admin verify DNS CNAME record
3. Tạo mapping: domain → tenant ID trong database
4. Cấu hình Cloudflare Tunnel để điều hướng traffic
5. SSL certificate tự động (via Let's Encrypt)
6. Frontend nhận request, lookup tenant từ hostname, phục vụ config

**Logic API**:
```
POST /api/v1/tenants/{tenantId}/domains
Body: {
  "domain": "shop.mycompany.com",
  "dnsRecord": "CNAME shop-volo.ngrok.io"
}

Response: {
  "domainId": "uuid",
  "domain": "shop.mycompany.com",
  "status": "pending_verification",
  "verificationCode": "txt_record_value"
}
```

**Caching Logic** (Cloudflare):
- Domain → Tenant ID mapping cached in Cloudflare Workers
- Cache TTL = 24 giờ
- Invalidate on domain update

---

## 4. Ghi chú kỹ thuật & API Testing (Postman)

### Kiểm soát tài nguyên (6GB RAM)

#### Backend Optimization
```bash
# NestJS: Limit memory to avoid OOM
node --max-old-space-size=1024 dist/main.js

# MongoDB: Memory limit in docker-compose
services:
  mongodb:
    image: mongo:7
    mem_limit: 512m
    memswap_limit: 512m

# PostgreSQL: Memory limit
services:
  postgres:
    image: postgres:16
    mem_limit: 512m
    memswap_limit: 512m

# Redis: Memory limit
services:
  redis:
    image: redis:7-alpine
    mem_limit: 256m
    memswap_limit: 256m
```

#### Frontend Optimization
- Chỉ khởi động Next.js (Admin) khi cần test giao diện người dùng cuối
- Storefront dùng JSON layout → tránh build time, runtime rendering nhẹ
- Tối ưu: image compression, code splitting, lazy loading

### Chiến lược Test API với Postman

#### Postman Collections Có sẵn
- **Location**: `/apps/api-core/postman/`
- **Collection 1**: `cache-testing.postman_collection.json` — Validates caching behavior
- **Collection 2**: `shopvolo-usecases.postman_collection.json` — All 10 use-cases (được tạo sau)

#### Test Workflow
1. **Cache Testing** (Collection 1):
   ```
   GET /api/layouts/shop123 (cold cache)
   ↓ [measure response time]
   GET /api/layouts/shop123 (warm cache) ← should be < 10ms
   ↓
   POST /api/layouts/shop123/publish (invalidate)
   ↓
   GET /api/layouts/shop123 (new data)
   ```

2. **ShopVolo Use-cases** (Collection 2):
   ```
   For each UC-01 to UC-10:
     - Request template with sample data
     - Verify 200 response
     - Validate response schema
     - Test multi-tenant scoping (x-tenant-id header)
   ```

#### Headers bắt buộc
```
x-tenant-id: shop123              # Multi-tenant isolation
Authorization: Bearer {token}      # JWT authentication (if required)
Content-Type: application/json     # API format
x-request-id: {uuid}              # Request tracking
```

#### Postman Environment Variables
```
{{baseUrl}}        = http://localhost:3000
{{tenantId}}       = shop123
{{authToken}}      = (JWT token, generated via /auth/login)
{{timeout}}        = 5000ms
{{cacheThreshold}} = 10            # Cache response time target (ms)
```

#### Validation Checklist
- ✅ Kiểm tra status code (200, 201, 400, 403, 500)
- ✅ Verify response JSON format matches schema
- ✅ Validate deep merge logic (Master Template + Tenant Config)
- ✅ Test cache hits (< 10ms response time)
- ✅ Test multi-tenant isolation (shop123 không thấy data của shop456)
- ✅ Test authorization (403 for unauthorized users)
- ✅ Performance: all requests < 500ms (excluding cold cache)

---

## 5. Deep Merge Logic — Key Technical Insight

### Định nghĩa
**Deep Merge**: Kỹ thuật kết hợp Master Template (default) + Tenant Config (overrides) thành một layout JSON duy nhất.

### Ví dụ
```javascript
// Master Template (từ Super Admin)
const masterTemplate = {
  header: {
    logo: "default-logo.png",
    colors: { primary: "#000000", secondary: "#FFFFFF" },
    navigation: "default-nav"
  },
  footer: {
    copyright: "© 2026 ShopVolo"
  }
};

// Tenant Config (override từ Shop Owner)
const tenantConfig = {
  header: {
    logo: "shop-logo.png",
    colors: { primary: "#FF0000" }
    // không override secondary, navigation
  }
};

// Kết quả sau deep merge
const merged = {
  header: {
    logo: "shop-logo.png",                    // ← from tenant
    colors: {
      primary: "#FF0000",                     // ← from tenant
      secondary: "#FFFFFF"                    // ← from master
    },
    navigation: "default-nav"                 // ← from master
  },
  footer: {
    copyright: "© 2026 ShopVolo"             // ← from master
  }
};
```

### Yêu cầu
- Merge phải **recursive** (deep, không shallow)
- Lưu chỉ **overrides** (tenant config) để tối ưu DB
- Cache kết quả merged vào Redis
- Invalidate cache khi tenant config thay đổi

---

## 6. Định hướng kiến trúc

### Database Schema
- **PostgreSQL**: Tenants, Users, Orders, Inventory (structured)
- **MongoDB**: Layouts, Navigation, Pages, Tenant Config (flexible JSON)

### API Architecture
- **Base URL**: `http://localhost:3000/api/v1`
- **Authentication**: JWT tokens (HS256)
- **Multi-tenancy**: AsyncLocalStorage + TenantInterceptor
- **Error Handling**: Custom exception filters (400, 403, 500)
- **Logging**: Structured logging (JSON) to stdout

### Frontend Architecture (Next.js)
- **Storefront**: Fetch `/api/v1/storefront/config`, render from JSON
- **Admin**: Server-side render product list, client-side edit forms
- **Pages**: SSG for static content, ISR for product listings

### Caching Strategy
- **HTTP Cache**: ETag, Last-Modified headers (frontend can use)
- **Server Cache**: Redis for `/storefront/config` (TTL=1h)
- **Database Query Cache**: NestJS CacheManager (default: 5 min)
- **CDN Cache** (future): Cloudflare for static assets + API responses

---

## 7. Tài liệu liên quan

| Tài liệu | Link | Mục đích |
| :--- | :--- | :--- |
| API Core Docs | [.agents/apps/api-core/README.md](.agents/apps/api-core/README.md) | Hướng dẫn chạy API Core |
| Postman Collections | `apps/api-core/postman/` | Test API endpoints |
| Project Structure | [README.md](../../README.md) | Tổng quan project |
| Agents & Permissions | [AGENTS.md](../../AGENTS.md) | Role-based access control |

---

## 8. Lộ trình phát triển (Roadmap)

### Sprint 1: Xác thực (Validation)
- [x] Design use-cases + APIs
- [ ] Implement UC-01 (Onboarding)
- [ ] Implement UC-02 (Master Templates)
- [ ] Test via Postman

### Sprint 2: Core Features
- [ ] Implement UC-03 to UC-05 (Branding, Products, Navigation)
- [ ] Setup Redis caching
- [ ] Performance testing (< 500ms per request)

### Sprint 3: Customer Experience
- [ ] Implement UC-06 to UC-08 (Pages, Browsing, Cart)
- [ ] Storefront rendering engine
- [ ] Product filtering & search

### Sprint 4: Payment & Completion
- [ ] Implement UC-09 (Checkout + Payment)
- [ ] Webhook handling (payment callbacks)
- [ ] Order management dashboard

### Sprint 5: Domain & Scale
- [ ] Implement UC-10 (Domain Mapping)
- [ ] Cloudflare Tunnel setup
- [ ] Load testing (20k shops simulation)

---

**Tài liệu được tạo cho dự án Đồ án tốt nghiệp ShopVolo v2.**  
*Version 1.0, April 16, 2026*
