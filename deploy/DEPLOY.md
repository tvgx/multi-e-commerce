# Production deploy — AWS Lightsail (1 box) + Supabase/Atlas free

Triển khai toàn bộ hệ thống lên **1 máy AWS Lightsail 2GB** bằng Docker Compose.
Image build sẵn trên CI (ghcr.io); box chỉ kéo về chạy. Postgres/Mongo dùng
Supabase/Atlas free. Object storage (MinIO), Redis, imgproxy, Caddy chạy trên box.

```
Caddy(:80/:443) ── api.<d>      → api-core:3000
                ── admin.<d>    → admin:3000
                ── cdn.<d>      → minio:9000        (ảnh public)
                ── images.<d>   → imgproxy:8080
                ── <d> + *.<d>  → storefront:3002   (multi-tenant, TLS on-demand)
```
`<d>` = `ROOT_DOMAIN` = `tvgx1.id.vn`.

---

## 0. Build images trên CI (làm 1 lần / mỗi lần đổi code)

Workflow [.github/workflows/ci-cd.yml](../.github/workflows/ci-cd.yml) build & push 5 image
lên ghcr.io: `-api-core`, `-admin`, `-storefront`, `-shop-builder`, `-design-agent`.

- Trigger: push lên `main`, **hoặc** GitHub → Actions → *CI/CD Pipeline* → *Run workflow*.
- `NEXT_PUBLIC_*` được bake lúc build, mặc định domain `tvgx1.id.vn`. Nếu dùng domain
  khác, đặt **Repo Variables** (Settings → Secrets and variables → Actions → *Variables*):
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STOREFRONT_URL`, `NEXT_PUBLIC_STOREFRONT_HOST`,
  `NEXT_PUBLIC_IMAGE_PROXY_URL`.
- Image mặc định **private**. Hoặc để pull dễ: GitHub → Packages → mỗi package →
  Package settings → *Change visibility* → Public (khi đó box không cần `docker login`).

---

## 1. Tạo máy Lightsail + chuẩn bị OS

1. Lightsail → Create instance → **Ubuntu 22.04**, plan **2 GB RAM / 2 vCPU** (~$12/mo,
   thường free 3 tháng đầu). Tạo & gán **Static IP**.
2. Networking → mở cổng **22, 80, 443** (TCP).
3. SSH vào box, tạo **swap 3 GB** (chống OOM khi worker build spike):
   ```bash
   sudo fallocate -l 3G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
4. Cài Docker:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER && exit   # đăng nhập lại để có quyền docker
   ```

## 2. DNS (trỏ về Static IP của box)

Tạo các bản ghi **A** trỏ về IP tĩnh:

| Host | Loại | Giá trị |
|------|------|---------|
| `tvgx1.id.vn` (apex / @) | A | `<STATIC_IP>` |
| `*` (wildcard) | A | `<STATIC_IP>` |
| `api` | A | `<STATIC_IP>` |
| `admin` | A | `<STATIC_IP>` |
| `cdn` | A | `<STATIC_IP>` |
| `images` | A | `<STATIC_IP>` |

> `id.vn` là *public suffix* → `tvgx1.id.vn` là registrable domain, các subdomain là
> same-site nên cookie `Domain=.tvgx1.id.vn` chia sẻ được giữa `admin.` ↔ `api.`.

## 3. Lấy file deploy + login ghcr

```bash
git clone https://github.com/lordfeeder/multi-e-commerce.git
cd multi-e-commerce/deploy
# Nếu image để private:
echo "<GHCR_PAT_read:packages>" | docker login ghcr.io -u <github-user> --password-stdin
```

## 4. Điền secret

```bash
cp .env.prod.example .env
nano .env   # điền DATABASE_URL/DIRECT_URL (Supabase), MONGO_DB_ATLAS, MINIO_*,
            # BETTER_AUTH_SECRET, INTERNAL_API_KEY, REVALIDATE_SECRET, ACME_EMAIL...
            # Sinh secret: openssl rand -hex 32
```

## 5. Migrate + seed DB (chỉ khi DB CHƯA có schema)

> ⚠️ Nếu dùng **đúng Supabase DB đang dev**, schema + dữ liệu geo (provinces/wards) **đã có sẵn**
> → BỎ QUA bước này. Kiểm tra trước:
> ```bash
> docker compose -f docker-compose.prod.yaml run --rm shop-builder \
>   sh -lc "npm run prisma:build && npx prisma migrate status --schema=packages/database/prisma/schema.prisma"
> ```
> Lưu ý: repo này có lịch sử migration hand-written (xem ghi chú nội bộ) — nếu `migrate status`
> báo drift, KHÔNG chạy `migrate deploy` mù; đối chiếu thủ công trước.

Với **DB mới** (migrate deploy dùng `DIRECT_URL` :5432, không dùng pooler):
```bash
docker compose -f docker-compose.prod.yaml run --rm shop-builder \
  sh -lc "npm run prisma:build && npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma"
docker compose -f docker-compose.prod.yaml run --rm shop-builder npm run seed:geo
```

## 6. Khởi động

```bash
docker compose -f docker-compose.prod.yaml pull
docker compose -f docker-compose.prod.yaml up -d
docker compose -f docker-compose.prod.yaml ps
docker stats --no-stream      # kiểm tra tổng RAM (~< 1.7GB lúc idle)
```
Caddy tự xin cert Let's Encrypt cho api/admin/cdn/images/apex; tenant subdomain cấp
cert on-demand ở request đầu. MinIO tự tạo bucket + public-read khi api-core boot.

## 7. Smoke test

```bash
curl -I https://api.tvgx1.id.vn/api/docs            # 200 + cert hợp lệ
```
- Mở `https://admin.tvgx1.id.vn` → đăng nhập owner → không lỗi CORS/401 (cookie
  `Domain=.tvgx1.id.vn` được gửi sang `api.`).
- Mở `https://tvgx1.id.vn` và một shop `https://<shop>.tvgx1.id.vn` → render OK.
- Upload ảnh sản phẩm → URL `https://cdn.tvgx1.id.vn/shop-public/<shopId>/...` mở được.
- Tạo + publish shop → `docker compose ... logs -f shop-builder` thấy job `build-shop`;
  bảng `shop_build_jobs` chạy `percent`.

---

## Vận hành

**Deploy phiên bản mới** (sau khi CI build xong image `:latest`):
```bash
docker compose -f docker-compose.prod.yaml pull
docker compose -f docker-compose.prod.yaml up -d
docker image prune -f
```
**Logs:** `docker compose -f docker-compose.prod.yaml logs -f <service>`
**Restart:** `docker compose -f docker-compose.prod.yaml restart <service>`

## Lưu ý quan trọng

- **api-core CHỈ 1 replica.** Socket.io (`/notifications`, `/chat`) giữ state in-memory;
  scale >1 sẽ vỡ realtime trừ khi thêm `@socket.io/redis-adapter`.
- **MinIO ↔ AWS S3:** đang dùng MinIO trên box (zero code change). Muốn đổi sang S3 thật
  cần sửa naming bucket + tắt public-policy call trong
  [minio.service.ts](../apps/api-core/src/common/services/minio.service.ts).
- **TLS tenant subdomain** dùng on-demand (Caddyfile). Nếu muốn 1 wildcard cert qua DNS-01,
  chuyển nameserver sang Cloudflare + dùng caddy-dns/cloudflare (xem comment trong Caddyfile).
- **design-agent (Import Figma) là DỊCH VỤ TRẢ PHÍ + nội bộ.** Chỉ api-core gọi nó qua
  mạng Docker (`DESIGN_AGENT_URL=http://design-agent:3100`), KHÔNG mở route public. Cần điền
  `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `FIGMA_TOKEN` trong `.env` và `INTERNAL_API_KEY` phải
  **giống** giữa api-core ↔ design-agent. Không chạy design-agent thì nút "Import Figma" sẽ báo
  lỗi cấu hình — phần còn lại của hệ thống vẫn hoạt động bình thường.
- **RAM 2GB sát ngưỡng.** Thêm design-agent (~400M trần) đẩy tổng trần lên cao → khi bật
  design-agent nên dùng box **4GB** (~$24/mo). Nếu giữ 2GB: tăng swap, hoặc giảm
  `SHOP_BUILD_CONCURRENCY`. Nếu hay OOM: nâng Lightsail 4GB, hoặc offload Redis sang
  Upstash free (đổi `REDIS_HOST`/`REDIS_PORT` trong compose).
- **Backup:** Supabase/Atlas có backup riêng. MinIO data nằm ở volume `minio_data` —
  snapshot Lightsail định kỳ hoặc sync sang S3.
