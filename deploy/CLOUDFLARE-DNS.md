# Chuyển DNS sang Cloudflare Free — tvgx1.id.vn

Hướng dẫn đưa tên miền `tvgx1.id.vn` về Cloudflare quản lý DNS (plan Free, $0),
trỏ toàn bộ về box Lightsail `54.151.215.169` theo đúng sơ đồ trong [DEPLOY.md](DEPLOY.md).

> **Nguyên tắc quan trọng nhất:** mọi bản ghi để ở chế độ **DNS only (đám mây XÁM)**,
> KHÔNG bật proxy (đám mây cam). Caddy trên box tự xin cert Let's Encrypt qua HTTP-01
> và cấp cert on-demand cho subdomain shop — bật proxy cam sẽ chen Cloudflare vào giữa
> và phá cơ chế này. Muốn bật proxy thì xem mục 7 (cần đổi sang DNS-01, làm sau).

---

## 1. Tạo tài khoản Cloudflare

1. Vào <https://dash.cloudflare.com/sign-up>.
2. Đăng ký bằng email + mật khẩu → xác nhận email (bấm link trong hộp thư).

## 2. Thêm tên miền vào Cloudflare

1. Dashboard → **Add a domain** (nút `+ Add site`).
2. Nhập `tvgx1.id.vn` → Continue.
   - `id.vn` là public suffix nên `tvgx1.id.vn` được Cloudflare nhận như một zone
     độc lập bình thường — không cần plan trả phí.
3. Chọn plan **Free** (kéo xuống dưới cùng, $0/month) → Continue.
4. Cloudflare tự quét bản ghi DNS hiện có từ zonedns.vn và import — **đừng tin
   kết quả quét**: nó thường sót wildcard và mang theo bản ghi parking rác.
   Rà lại toàn bộ theo bước 3.

## 3. Khai báo bản ghi DNS

Vào tab **DNS → Records**, sửa/thêm để có đúng bộ sau (Type **A**, IPv4 = IP tĩnh
Lightsail):

| Type | Name (Host) | IPv4 address     | Proxy status         | TTL  |
|------|-------------|------------------|----------------------|------|
| A    | `@` (apex)  | `54.151.215.169` | **DNS only** (xám)   | Auto |
| A    | `*`         | `54.151.215.169` | **DNS only** (xám)   | Auto |
| A    | `api`       | `54.151.215.169` | **DNS only** (xám)   | Auto |
| A    | `admin`     | `54.151.215.169` | **DNS only** (xám)   | Auto |
| A    | `cdn`       | `54.151.215.169` | **DNS only** (xám)   | Auto |
| A    | `images`    | `54.151.215.169` | **DNS only** (xám)   | Auto |
| A    | `www`       | `54.151.215.169` | **DNS only** (xám)   | Auto |

- Khi thêm bản ghi, Cloudflare mặc định bật **Proxied (cam)** → nhớ click biểu
  tượng đám mây để chuyển về **DNS only (xám)** cho TỪNG bản ghi.
- **Xoá** mọi bản ghi trỏ về `103.176.179.28` (server parking của registrar) và
  bản ghi rác import theo (MX/TXT/CNAME lạ) nếu không dùng email trên domain này.
- Wildcard `*` bắt buộc phải có — tenant storefront `<shop>.tvgx1.id.vn` sống nhờ nó.

## 4. Đổi nameserver tại nơi đăng ký tên miền

1. Ở bước cuối khi add site, Cloudflare hiển thị **2 nameserver** được gán cho
   tài khoản của bạn, dạng:
   ```
   xxxx.ns.cloudflare.com
   yyyy.ns.cloudflare.com
   ```
   (tên cụ thể xem tại Overview của zone → mục *Update your nameservers*).
2. Đăng nhập trang quản lý tên miền nơi đã đăng ký `tvgx1.id.vn`
   (nameserver hiện tại là `ns1–ns4.zonedns.vn` → thường là Tenten.vn, nơi cấp
   id.vn miễn phí).
3. Tìm mục **Quản lý tên miền → Đổi DNS / Nameserver** (tên mục tuỳ registrar).
4. Xoá cả 4 nameserver `zonedns.vn`, điền đúng 2 nameserver Cloudflare → Lưu.
5. Quay lại Cloudflare → bấm **Check nameservers now**. Propagate thường vài phút
   tới vài giờ (tối đa 24–48h). Khi xong, Cloudflare gửi email
   *"tvgx1.id.vn is now active on Cloudflare"*.

> Sau khi đổi NS, mọi bản ghi cũ ở zonedns.vn hết hiệu lực — DNS chỉ còn đọc từ
> Cloudflare. Vì vậy phải khai đủ bản ghi ở bước 3 TRƯỚC khi đổi NS thì dịch vụ
> không bị gián đoạn.

## 5. Kiểm tra DNS đã đúng

Chạy từ máy bất kỳ:

```bash
nslookup -type=NS tvgx1.id.vn 8.8.8.8      # kỳ vọng: *.ns.cloudflare.com
nslookup tvgx1.id.vn 8.8.8.8               # 54.151.215.169
nslookup api.tvgx1.id.vn 8.8.8.8           # 54.151.215.169
nslookup shopbatky123.tvgx1.id.vn 8.8.8.8  # 54.151.215.169 (wildcard hoạt động)
```

Hoặc kiểm tra propagate toàn cầu tại <https://dnschecker.org>.

## 6. Xin lại cert trên box (sau khi DNS active)

SSH vào box Lightsail:

```bash
cd multi-e-commerce/deploy

# 1. Kiểm tra env cấp cho Caddy — phải đúng domain + email THẬT
grep -E 'ROOT_DOMAIN|ACME_EMAIL' .env

# 2. Restart Caddy để xin cert ngay thay vì chờ backoff
docker compose -f docker-compose.prod.yaml restart caddy

# 3. Theo dõi tới khi thấy "certificate obtained successfully" cho từng host
docker compose -f docker-compose.prod.yaml logs -f caddy
```

Smoke test:

```bash
curl -I https://api.tvgx1.id.vn/api/docs   # 200 + cert Let's Encrypt hợp lệ
curl -I https://tvgx1.id.vn                # storefront apex
curl -I https://admin.tvgx1.id.vn          # admin dashboard
```

> ⚠️ Let's Encrypt giới hạn **5 lần validation fail / giờ / hostname**. Nếu Caddy
> đã retry nhiều trong lúc DNS còn sai, host đó có thể phải đợi ~1 giờ. Cứ để
> Caddy chạy — nó tự retry, không cần can thiệp.

## 7. (Tuỳ chọn, làm sau) Bật proxy cam Cloudflare

Giữ DNS only là đủ chạy production. Nếu về sau muốn bật Proxied (che IP gốc,
chống DDoS, cache tĩnh) thì đây là thay đổi kiến trúc riêng:

- Caddy phải chuyển sang **wildcard cert qua DNS-01** bằng plugin
  `caddy-dns/cloudflare` (build image Caddy custom, thêm Cloudflare API Token) —
  xem comment trong [Caddyfile](Caddyfile); cơ chế on-demand TLS hiện tại bỏ đi.
- Cloudflare SSL/TLS mode đặt **Full (strict)**.
- Universal SSL của Cloudflare chỉ cover apex + wildcard cấp 1
  (`*.tvgx1.id.vn`) — đủ cho mọi host trong sơ đồ hiện tại.

Chưa cần thì đừng làm — thêm một tầng proxy là thêm một tầng để debug.
