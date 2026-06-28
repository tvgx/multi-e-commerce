# COMPLETION HANDOFF — việc còn lại để hoàn thiện dự án

> **Tạo:** 2026-06-22 · **Branch:** `child` · **Người soạn:** audit session (Claude)
> **Mục đích:** Liệt kê đầy đủ những gì còn dang dở — từ feature lớn đến logic nối nhỏ
> giữa các page/component — để một session khác (khởi động lạnh) nhặt lên chạy tiếp.
>
> Mỗi mục có: **Triệu chứng · Nguyên nhân gốc · File liên quan · Cách làm · Cách verify.**
> Làm xong mục nào thì tick `[x]`. Khi hết toàn bộ, xoá file này (theo lệ `DIAGNOSTIC-HANDOFF.md` cũ).

---

## 0. Bối cảnh & gotcha môi trường (đọc trước khi code)

Monorepo Turbo. Apps: `admin` (Next.js, dashboard chủ shop + platform), `storefront`
(Next.js, mặt tiền mua hàng), `api-core` (NestJS), `design-agent`, `cli-tool`.
Packages: `database` (Prisma), `ui-registry` (component + section builder), `i18n`,
`schema`, `master-templates`.

Gotcha đã biết (xem auto-memory `MEMORY.md` để đủ ngữ cảnh):
- **Prisma migrations viết tay** — không có `DIRECT_URL`; deploy SQL qua session pooler (port 5432). Đừng chạy `prisma migrate dev` mù.
- **Prisma model mới** phải thêm vào `MODEL_FILES` của `packages/database/scripts/build-prisma-schema.js`, nếu không bị bỏ qua.
- **api-core KHÔNG có global ValidationPipe** — DTO decorators không chạy, phải validate tay trong service.
- **api-core KHÔNG có interceptor bọc response** — controller phải tự trả `BaseResponseDto.success(...)`, quên thì UI trắng câm lặng.
- **Jest trên WSL** vỡ vì thiếu `@unrs/resolver-binding-linux-x64-gnu` → cài lại `--no-save` sau mỗi lần install mới.
- **Test endpoint có guard:** forge cookie `owner.session_token` (token + HMAC-SHA256 base64) để curl; lật `user.role` trong Prisma để test admin gating.
- `EmailModule` đã export `EmailService`; `EmailProcessor` gửi SMTP thật qua nodemailer + template inline (cần `SMTP_HOST/USER/PASS`, `EMAIL_FROM` trong env).

---

## 🔴 P0 — Lỗi "trông như xong nhưng đứt ở backend"

### [x] P0-1. Reset mật khẩu Owner/Admin chết âm thầm — ĐÃ FIX (2026-06-25)

> Đã làm theo Approach B: `owner-auth.config.ts` nhận thêm `emailService` + cấu hình
> `emailAndPassword.sendResetPassword` (better-auth tự sinh token + link, callback gửi
> email). `auth.module.ts` import `EmailModule` + inject `EmailService` vào factory
> `OWNER_AUTH`. `auth.service.ts:forgotPassword` không còn `catch {}` nuốt lỗi — log lại
> nhưng vẫn trả message trung tính. Test: `owner-auth.config.spec.ts` (3 case, gọi trực
> tiếp callback) — xanh; tsc + jest auth suite xanh, không có vòng DI.

**Triệu chứng:** Trang admin "Forgot password?" gửi form → hiện "Check your email"
thành công, nhưng **email không bao giờ tới**. Reset password admin hoàn toàn không dùng được.

**Nguyên nhân gốc:** Admin UI gọi better-auth client `authClient.requestPasswordReset(...)`
→ đi vào instance better-auth mount tại `/api/auth/owner` (`apps/api-core/src/main.ts:73`).
Nhưng `createOwnerAuth()` **không cấu hình `emailAndPassword.sendResetPassword`** → better-auth
`forgetPassword()` ném lỗi. Controller custom `authService.forgotPassword` thì **nuốt mọi lỗi**
(`catch {}`) rồi vẫn trả success message → lỗi vô hình.
Phía **customer** đã nối đúng (custom, qua `storefront-auth.service.ts`); chỉ owner thiếu.

**File liên quan:**
- `apps/api-core/src/modules/auth/owner-auth.config.ts` ← **chỗ cần sửa chính**
- `apps/api-core/src/modules/auth/auth.module.ts` (factory provider `OWNER_AUTH`, hiện chỉ `inject: [PrismaService]`)
- `apps/api-core/src/modules/email/email.service.ts` (`sendResetPasswordEmail` đã có sẵn)
- `apps/api-core/src/modules/email/email.processor.ts` (template `reset-password` đã có)
- Tham chiếu pattern customer: `apps/api-core/src/modules/storefront-auth/storefront-auth.service.ts:185-212`
- UI (không cần đổi): `apps/admin/src/app/(auth)/forgot-password/page.tsx`, `.../reset-password/page.tsx`

**Cách làm (khuyến nghị — Approach B, đổi nhỏ nhất, tái dùng resetPassword đang chạy):**
1. Đổi chữ ký `createOwnerAuth(prisma, emailService)` trong `owner-auth.config.ts`, thêm:
   ```ts
   emailAndPassword: {
     enabled: true,
     autoSignInAfterSignUp: true,
     sendResetPassword: async ({ user, url }) => {
       await emailService.sendResetPasswordEmail(user.email, url, user.name ?? 'bạn');
     },
   },
   ```
   (better-auth tự sinh & lưu token ở bảng `verifications`, nên `authService.resetPassword`
   → `ownerAuth.api.resetPassword({ token })` hiện tại vẫn chạy nguyên — không cần đụng.)
2. `auth.module.ts`: import `EmailModule`, đổi factory:
   ```ts
   { provide: OWNER_AUTH,
     useFactory: (prisma, email) => createOwnerAuth(prisma, email),
     inject: [PrismaService, EmailService] }
   ```
   Thêm `EmailModule` vào `imports` của AuthModule (AuthModule là `@Global`; EmailModule không import ngược nên không vòng).
3. (Tuỳ chọn dọn dẹp) Bỏ `catch {}` nuốt lỗi trong `auth.service.ts:forgotPassword` thành log lỗi (vẫn trả message trung tính để không leak email tồn tại).

**Verify:**
- Build api-core không lỗi type (`emailService` được inject đúng).
- Curl `POST /api/auth/owner/request-password-reset` (hoặc bấm nút trên UI) → kiểm tra log
  `EmailProcessor` ghi `Processing email job ... reset-password` và `Email sent: <messageId>`.
- Lấy link reset từ email → trang reset-password đặt mật khẩu mới → đăng nhập lại được.
- Viết unit test theo mẫu `storefront-auth.service.spec.ts` (mock `sendResetPasswordEmail`).

---

### [x] P0-2. "Xác thực Tên miền" — ĐÃ LÀM THẬT (2026-06-25, Approach a)

> **Đã làm:** thêm cột `Shop.customDomain` (`domainVerified` đã có) + migration
> `20260625000000_shop_custom_domain`. Service `setCustomDomain` (chuẩn hoá+validate tay,
> chặn host nền tảng/trùng) + `verifyCustomDomain` (resolve TXT thật qua `dns/promises`,
> đối chiếu `shopVolo-verification=<shopId>`) + `resolveByHost`. Controller:
> `PATCH :shopId/domain`, `POST :shopId/domain/verify`, `GET by-host?host=` (Public).
> Storefront `middleware.ts` rewrite Host tên-miền-riêng → `/<slug>/...` (cache per-instance).
> Admin: hook `useDomainVerification` + trang domain viết lại (nhập domain → lưu → hiện TXT+CNAME
> → Xác thực thật). Test: 6 case mới trong `shop.service.spec.ts` (mock dns). **api-core 432/432 jest xanh; tsc 3 app exit 0.**
>
> ⚠️ **Cần deploy migration** `20260625000000_shop_custom_domain` qua session pooler (port 5432)
> trước khi dùng trên DB thật. Routing production còn cần CNAME + reverse-proxy chấp nhận host
> (Cloudflare tunnel/ingress) — phần hạ tầng, ngoài code.

**Triệu chứng (gốc):** Trang Settings → Domain hiện bản ghi DNS để khách thêm, nút "Verify"
luôn "thành công" bất kể DNS thực tế.

**Nguyên nhân gốc:** `useDomainVerification.verify()` chỉ gọi `POST /api/shops/:id/build`
rồi set success — **không kiểm tra DNS**. Không có endpoint domain nào trong api-core.

**File liên quan:**
- `apps/admin/src/app/dashboard/[shopId]/settings/domain/page.tsx`
- `apps/admin/src/hooks/useDomainVerification.ts`

**Cách làm:** Đây là **quyết định sản phẩm** — chọn 1:
- (a) Làm thật: thêm cột `customDomain`/`domainVerified` vào Shop, endpoint `POST /api/shops/:id/domain/verify`
  thực sự resolve TXT/CNAME record, + routing reverse-proxy (Cloudflare tunnel / ingress) cho custom domain ở storefront middleware.
- (b) Ẩn feature: gỡ menu "Domain" khỏi settings cho tới khi làm thật, tránh hứa hẹn sai.

**Verify:** tuỳ hướng chọn. Nếu (a): point một domain test, bấm verify khi DNS sai → phải báo lỗi; khi đúng → pass + storefront phục vụ qua domain đó.

---

## 🟠 P1 — Feature lớn còn stub "Coming Soon" (platform-level, cross-shop)

> 3 trang dashboard cấp platform chỉ là `ComingSoonPage`, chưa có backend. Đây là quyết
> định scope — cần chốt làm thật hay tiếp tục ẩn. Per-shop dashboard (`[shopId]/*`) đã đầy đủ.

### [x] P1-1. Product Catalog — ĐÃ LÀM THẬT (2026-06-25)

> **Đã làm (Approach: gộp + phân phối, tái dùng schema, KHÔNG thêm bảng):**
> Backend owner-scoped `PlatformCatalogService` + `PlatformCatalogController` (route
> `catalog/platform/*`): `GET products` gộp sản phẩm mọi shop của owner (kèm nhãn shop,
> giá thấp nhất, lọc theo shop/search); `POST products/:id/distribute` sao chép sản phẩm
> (kèm biến thể) sang nhiều shop đích — bỏ qua trùng slug, tự thêm hậu tố SKU trùng,
> categoryId=null, status=DRAFT. UI: `catalog/page.tsx` viết lại (grid + tìm kiếm + lọc
> shop + modal phân phối chọn nhiều shop) + hook `usePlatformCatalog`. Card dashboard +
> sidebar đổi sang Active. Test: `platform-catalog.service.spec.ts` (9 case). **api-core
> 441/441 jest xanh; tsc admin/api-core exit 0.**
>
> Giới hạn đã biết (ghi để mở rộng sau): clone chưa mang theo OptionType/VariantOptionValue
> (option wiring per-shop) — chỉ name/slug/description/images/variants(price,weight,sku).

### [ ] P1-2. Billing & Plans (gói/đăng ký/hoá đơn)
- `apps/admin/src/app/dashboard/(platform)/billing/page.tsx`

### [ ] P1-3. Developer API (API keys / webhooks / docs)
- `apps/admin/src/app/dashboard/(platform)/developer/page.tsx`

Component stub chung: `apps/admin/src/components/platform/ComingSoonPage.tsx`.

---

## 🟡 P2 — Mâu thuẫn nhãn & link chết (UI nhỏ, sửa nhanh)

### [x] P2-1. Nhãn card platform dashboard sai thực tế — ĐÃ SỬA (2026-06-25)
File: `apps/admin/src/app/dashboard/(platform)/page.tsx`
- Card **"Theme Market"** → Active (themes là theme-review console thật, 125 dòng, `dashboard/(platform)/themes`).
- Card **"Billing & Plans"** → gắn badge *Coming Soon* (page chỉ là `ComingSoonPage` stub — P1-2).
- **Bonus:** `GlobalSidebar.tsx` cùng lỗi → bỏ `badge: soon` ở themes, thêm vào billing.

### [x] P2-2. Tooltip "Coming soon" cũ trên link forgot-password — ĐÃ SỬA (2026-06-25)
File: `apps/admin/src/app/(auth)/login/page.tsx` — đã gỡ `title="Coming soon"` (forgot-password chạy thật sau P0-1).

### [x] P2-3. Link `href="#"` dẫn đi đâu cũng không — ĐÃ SỬA (2026-06-25)
- Tạo trang pháp lý tĩnh thật: `apps/admin/src/app/legal/privacy/page.tsx` + `.../legal/terms/page.tsx` (tiếng Việt, nội dung chuẩn).
- `GlobalFooter.tsx`: Privacy→`/legal/privacy`, Terms→`/legal/terms`; **gỡ** Documentation + System Status (không có đích thật → ẩn thay vì giả).
- `login/page.tsx` & `register/page.tsx`: Privacy Policy / Terms of Service trỏ về 2 trang trên.

---

## 🟡 P3 — Section builder "trang trí" chưa nối dữ liệu thật

Nhóm section emerald trong `packages/ui-registry/src/components/sections/`
(collections, storytelling, products) render nội dung hardcode + `href="#"`:
`CollectionLinksText`, `CollectionListsBento/Grid/Carousel/Editorial`,
`BlogPostGrid/Carousel`, `RecommendedProducts`, `FeaturedCollectionEditorial`...

→ Chưa đọc collection/product thật.

> ⚠️ **CỐ Ý CHƯA ĐỤNG** theo quy ước dự án (auto-memory `ui-p0-conventions`). Ghi ở đây cho
> đủ bức tranh. **Đừng tự sửa** trừ khi có yêu cầu rõ ràng — đụng vào có thể vỡ builder.

---

## 🟡 P4 — Tài liệu báo cáo — ĐÃ ĐIỀN NỘI DUNG (2026-06-25)

> **Đã làm:** điền tất cả placeholder dạng nội dung/số liệu/kết luận bằng dữ liệu THẬT
> đo từ mã nguồn (không bịa benchmark): Ch.1 (kết quả: 23 module/188 endpoint/49 model/
> ~65.5K LOC/441 test pass), Ch.4 §4.3.2 (thống kê thật) + §4.4 (34 suite/441 ca/100% pass,
> nêu cả lỗi P0-1 phát hiện & vá), §4.5 (số liệu hiệu năng ghi rõ "chưa đo, để §6.2"),
> Ch.5 §5.1 (kết quả định tính + định lượng để §6.2), Ch.6 §6.1 (kết luận đầy đủ: đã làm /
> hạn chế / bài học).
>
> **CÒN LẠI (đúng ý đồ — KHÔNG phải nội dung thiếu):** các `[…]` còn lại là **chỉ dẫn vẽ
> hình/bảng khi chuyển LaTeX** (UML package/class/ER, biểu đồ use-case/hoạt động/trình tự,
> bảng so sánh nền tảng, screenshot màn hình) + checklist `[x]/[ ]` chọn use-case ở
> `00_use-cases.md`. Các phần này cần người vẽ hình/đo tải, không điền bằng văn xuôi được.
> Số liệu hiệu năng định lượng (RPM, thời gian phản hồi/dựng shop, cache-hit) **cố ý chưa
> bịa** — chờ kiểm thử tải (đã ghi trong §6.2).

---

## Thứ tự đề xuất

1. **P0-1** (reset mật khẩu owner) — bug ngầm, fix gọn, hạ tầng sẵn. Làm trước + có test.
2. **P2-1/P2-2/P2-3** — sửa nhãn & link chết, nhanh, gọn giao diện ngay.
3. **P0-2** (domain) & **P1** (catalog/billing/developer) — cần **chốt scope sản phẩm** trước khi code.
4. **P4** — điền báo cáo.

## KHÔNG đụng (cố ý dang dở)
- P3 — section builder emerald (`ui-registry/.../sections/`).
- Email verification của owner (đang comment trong `owner-auth.config.ts`) — chấp nhận tắt.
