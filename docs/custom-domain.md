# Chạy shop trên một tên miền hoàn toàn mới (TODO 5)

Nền tảng đã hỗ trợ sẵn hai kiểu địa chỉ cho một shop:

1. **Subdomain nền tảng**: `<slug>.tvgx1.id.vn` — tự có ngay khi tạo shop.
2. **Tên miền riêng của người bán** (vd `shopcuatoi.com` hoặc `store.shopcuatoi.com`)
   — mục này hướng dẫn các bước để bật.

Toàn bộ code path đã tồn tại, KHÔNG cần sửa code:

- Admin: `Dashboard → Settings → Domain` (`apps/admin/src/app/dashboard/[shopId]/settings/domain/page.tsx`)
  cho nhập tên miền, sinh bản ghi TXT xác thực + CNAME, và nút verify.
- api-core: `POST /api/shops/:id/custom-domain` lưu domain, `POST .../verify`
  kiểm tra TXT, `GET /api/shops/by-host?host=` map host→slug (public).
- Storefront middleware (`apps/storefront/src/middleware.ts`): host lạ →
  gọi `by-host` → rewrite về `/[shopSlug]/...` (cache 5 phút).

## Các bước cho người bán

### 1. Khai báo tên miền trong Admin

`Dashboard → Settings → Domain` → nhập tên miền (vd `store.shopcuatoi.com`) →
màn hình hiển thị 2 bản ghi DNS cần tạo:

| Loại  | Tên (host)                  | Giá trị                                  |
|-------|-----------------------------|-------------------------------------------|
| TXT   | theo hướng dẫn trên màn hình | token xác thực sở hữu                     |
| CNAME | `store` (hoặc `@` nếu apex*) | `NEXT_PUBLIC_STOREFRONT_CNAME_TARGET` (mặc định trỏ về host storefront nền tảng) |

\* Apex domain (`shopcuatoi.com`) không tạo CNAME được ở đa số DNS — dùng
bản ghi **A** trỏ thẳng IP của box (Lightsail), hoặc dùng Cloudflare
(CNAME flattening).

### 2. Tạo bản ghi ở nhà cung cấp DNS (vd Cloudflare)

1. Thêm bản ghi TXT đúng tên + giá trị được cấp.
2. Thêm CNAME/A trỏ về hạ tầng nền tảng:
   - Cloudflare: bật proxy (đám mây cam) để có HTTPS ngay từ cert của Cloudflare;
   - hoặc DNS-only + cấp cert trên box (bước 4).

### 3. Bấm "Verify" trong Admin

api-core query TXT record; khớp token → `Shop.domainVerified = true`. Từ lúc này
`GET /api/shops/by-host` trả slug cho host đó và middleware storefront bắt đầu
rewrite (cache tối đa 5 phút).

### 4. HTTPS

- **Cloudflare proxy**: xong luôn — cert do Cloudflare cấp, origin giữ nguyên.
- **Trỏ thẳng box**: thêm host vào cấu hình reverse-proxy trên box
  (Caddy tự cấp Let's Encrypt theo on-demand TLS nếu bật; nginx thì chạy
  `certbot --nginx -d store.shopcuatoi.com`). Xem `deploy/DEPLOY.md` cho
  layout reverse-proxy hiện tại.

### 5. Kiểm tra

```bash
dig +short TXT <tên-bản-ghi-txt>
curl -s "https://api.tvgx1.id.vn/api/shops/by-host?host=store.shopcuatoi.com" | jq .data
curl -I https://store.shopcuatoi.com   # 200, nội dung của shop
```

## Lưu ý vận hành

- `PLATFORM_HOSTS` (env api-core) chặn người bán khai tên miền của nền tảng.
- Middleware cache host→slug 5 phút per-instance — đổi/gỡ domain cần đợi tối đa
  5 phút hoặc restart storefront.
- SEO: canonical của shop vẫn sinh theo `shopUrl()` — khi shop có custom domain
  đã verify, `shopPublicUrl()` (admin) ưu tiên domain riêng.
