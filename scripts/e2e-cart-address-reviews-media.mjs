// E2E test: server-side cart, address book, review moderation, media delete.
// Creates its own owner/shop/product fixture — does not touch existing shops.
// Run: node scripts/e2e-cart-address-reviews-media.mjs  (API_BASE để đổi port)
import { PrismaClient } from '@prisma/client';

const API = process.env.API_BASE || 'http://localhost:3000/api';
const prisma = new PrismaClient();
const stamp = Date.now();

let passed = 0, failed = 0;
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${detail}`); }
}

async function req(method, path, { body, cookie, bearer, shopId, formData } = {}) {
  const headers = { origin: 'http://localhost:3001' };
  if (!formData) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  if (shopId) headers['x-shop-id'] = shopId;
  const res = await fetch(`${API}${path}`, {
    method, headers, body: formData ?? (body ? JSON.stringify(body) : undefined),
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json, setCookie: res.headers.getSetCookie?.() ?? [] };
}

// ===== 1. Owner sign-up =====
console.log('\n== 1. Owner sign-up ==');
const ownerEmail = `e2e-owner-${stamp}@test.local`;
const signup = await req('POST', '/auth/owner/sign-up/email', {
  body: { email: ownerEmail, password: 'e2e-password-123', name: 'E2E Owner' },
});
check('owner sign-up 200', signup.status === 200, `got ${signup.status}`);
const ownerCookie = signup.setCookie.map(c => c.split(';')[0]).join('; ');
const ownerId = signup.json?.user?.id;
if (!ownerId) {
  console.log('Không tạo được owner — dừng test.');
  await prisma.$disconnect();
  process.exit(1);
}

// ===== 2. Seed shop fixture =====
console.log('\n== 2. Seed shop + product fixture ==');
const shop = await prisma.shop.create({
  data: { name: `E2E Shop ${stamp}`, domain: `e2e-${stamp}`, ownerId, status: 'ACTIVE' },
});
const location = await prisma.stockLocation.create({
  data: { shopId: shop.id, name: 'Kho E2E', isDefault: true },
});
const product = await prisma.product.create({
  data: { shopId: shop.id, name: 'Áo thun E2E', slug: `ao-thun-e2e-${stamp}`, status: 'PUBLISHED' },
});
const variant = await prisma.variant.create({
  data: { shopId: shop.id, productId: product.id, sku: `E2E-SKU-${stamp}`, price: 150000, isMaster: true },
});
await prisma.stockItem.create({
  data: { stockLocationId: location.id, variantId: variant.id, countOnHand: 100 },
});
const adminOpts = { cookie: ownerCookie, shopId: shop.id };
console.log(`  shop=${shop.id}`);

// ===== 3. Buyer register + login =====
console.log('\n== 3. Buyer register + login ==');
const buyerEmail = `e2e-buyer-${stamp}@test.local`;
await req('POST', '/storefront-auth/register', {
  shopId: shop.id,
  body: { email: buyerEmail, password: 'buyer-pass-123', fullName: 'E2E Buyer' },
});
const login = await req('POST', '/storefront-auth/login', {
  shopId: shop.id, body: { email: buyerEmail, password: 'buyer-pass-123' },
});
const buyerToken = login.json?.data?.token || login.json?.data?.accessToken || login.json?.token;
check('buyer login token', !!buyerToken, JSON.stringify(login.json)?.slice(0, 200));
const buyerOpts = { bearer: buyerToken, shopId: shop.id };

// ===== 4. Wallet payment method + topup (để thanh toán checkout) =====
console.log('\n== 4. Wallet topup ==');
const pmToggle = await req('POST', '/wallet/admin/payment-method', { ...adminOpts, body: { active: true } });
const walletPmId = pmToggle.json?.id;
check('wallet PM enabled', !!walletPmId, JSON.stringify(pmToggle.json)?.slice(0, 200));
const topup = await req('POST', '/wallet/topup', { ...buyerOpts, body: { amount: 2000000 } });
await req('POST', `/wallet/topup/confirm/${topup.json?.token}`, { body: { action: 'confirm' } });
const w = await req('GET', '/wallet/me', buyerOpts);
check('wallet balance 2,000,000', w.json?.balance === 2000000, JSON.stringify(w.json));

// ===== 5. Server-side cart =====
console.log('\n== 5. Server-side cart ==');
const empty = await req('GET', '/cart', buyerOpts);
check('cart starts empty', empty.json?.data?.itemCount === 0, JSON.stringify(empty.json)?.slice(0, 200));

const add1 = await req('POST', '/cart/items', { ...buyerOpts, body: { variantId: variant.id, quantity: 2 } });
check('add item', add1.status === 201 && add1.json?.item?.quantity === 2, `got ${add1.status} ${JSON.stringify(add1.json)?.slice(0, 200)}`);

const add2 = await req('POST', '/cart/items', { ...buyerOpts, body: { variantId: variant.id, quantity: 1 } });
check('same variant increments', add2.json?.item?.quantity === 3, JSON.stringify(add2.json)?.slice(0, 200));
const itemId = add2.json?.item?.id;

const cart1 = await req('GET', '/cart', buyerOpts);
check('cart subtotal 450,000', cart1.json?.data?.subtotal === 450000, JSON.stringify(cart1.json?.data)?.slice(0, 300));
check('cart joins product info', cart1.json?.data?.items?.[0]?.variant?.product?.name === 'Áo thun E2E');

const upd = await req('PATCH', `/cart/items/${itemId}`, { ...buyerOpts, body: { quantity: 2 } });
check('update quantity', upd.json?.item?.quantity === 2, JSON.stringify(upd.json)?.slice(0, 200));

const badVariant = await req('POST', '/cart/items', { ...buyerOpts, body: { variantId: shop.id, quantity: 1 } });
check('foreign variant rejected', badVariant.status === 400, `got ${badVariant.status}`);

const badQty = await req('POST', '/cart/items', { ...buyerOpts, body: { variantId: variant.id, quantity: -2 } });
check('negative quantity rejected', badQty.status === 400, `got ${badQty.status}`);

// Checkout không truyền lineItems => lấy từ cart
const checkout1 = await req('POST', '/orders/checkout', { ...buyerOpts, body: { paymentMethodId: walletPmId } });
check('checkout from cart', checkout1.status === 201, `got ${checkout1.status} ${JSON.stringify(checkout1.json)?.slice(0, 300)}`);
check('order itemTotal 300,000', checkout1.json?.itemTotal === 300000, `got ${checkout1.json?.itemTotal}`);

const cart2 = await req('GET', '/cart', buyerOpts);
check('cart cleared after checkout', cart2.json?.data?.itemCount === 0, JSON.stringify(cart2.json?.data)?.slice(0, 200));

const emptyCheckout = await req('POST', '/orders/checkout', { ...buyerOpts, body: { paymentMethodId: walletPmId } });
check('empty-cart checkout 400', emptyCheckout.status === 400, `got ${emptyCheckout.status}`);

// ===== 6. Address book =====
console.log('\n== 6. Address book ==');
const addrA = await req('POST', '/addresses', {
  ...buyerOpts,
  body: { fullName: 'Nguyễn Văn A', phone: '0901111111', addressLine1: '1 Lê Lợi', city: 'HCM', province: 'HCM' },
});
check('first address is default', addrA.json?.address?.isDefault === true, JSON.stringify(addrA.json)?.slice(0, 200));
const addrAId = addrA.json?.address?.id;

const badCreate = await req('POST', '/addresses', { ...buyerOpts, body: { fullName: 'Thiếu phone' } });
check('missing required field 400', badCreate.status === 400, `got ${badCreate.status}`);

const addrB = await req('POST', '/addresses', {
  ...buyerOpts,
  body: { fullName: 'Nguyễn Văn B', phone: '0902222222', addressLine1: '2 Trần Hưng Đạo', city: 'Hà Nội', province: 'Hà Nội', isDefault: true },
});
const addrBId = addrB.json?.address?.id;
check('second address takes default', addrB.json?.address?.isDefault === true);

let list = await req('GET', '/addresses', buyerOpts);
check('list 2 addresses, default first', list.json?.data?.length === 2 && list.json?.data?.[0]?.id === addrBId, JSON.stringify(list.json)?.slice(0, 300));
check('old default unset', list.json?.data?.find(a => a.id === addrAId)?.isDefault === false);

const setDef = await req('POST', `/addresses/${addrAId}/default`, buyerOpts);
check('set default back to A', setDef.json?.address?.isDefault === true);

const updAddr = await req('PATCH', `/addresses/${addrBId}`, { ...buyerOpts, body: { phone: '0903333333' } });
check('update address phone', updAddr.json?.address?.phone === '0903333333');

// Checkout dùng địa chỉ đã lưu
await req('POST', '/cart/items', { ...buyerOpts, body: { variantId: variant.id, quantity: 1 } });
const checkout2 = await req('POST', '/orders/checkout', {
  ...buyerOpts, body: { paymentMethodId: walletPmId, shippingAddressId: addrAId },
});
check('checkout with saved address', checkout2.status === 201, `got ${checkout2.status} ${JSON.stringify(checkout2.json)?.slice(0, 300)}`);
check('order snapshots saved address', checkout2.json?.recipientName === 'Nguyễn Văn A' && checkout2.json?.shippingAddress === '1 Lê Lợi', JSON.stringify({ n: checkout2.json?.recipientName, a: checkout2.json?.shippingAddress }));

const badAddr = await req('POST', '/orders/checkout', {
  ...buyerOpts, body: { paymentMethodId: walletPmId, lineItems: [{ variantId: variant.id, quantity: 1 }], shippingAddressId: shop.id },
});
check('unknown saved address 400', badAddr.status === 400, `got ${badAddr.status}`);

const delDef = await req('DELETE', `/addresses/${addrAId}`, buyerOpts);
check('delete default address', delDef.status === 200, `got ${delDef.status}`);
list = await req('GET', '/addresses', buyerOpts);
check('remaining address promoted to default', list.json?.data?.length === 1 && list.json?.data?.[0]?.isDefault === true, JSON.stringify(list.json)?.slice(0, 200));

// ===== 7. Review moderation =====
console.log('\n== 7. Review moderation ==');
const orderId = checkout1.json?.id;
await prisma.order.update({ where: { id: orderId }, data: { state: 'delivered' } });

const rev = await req('POST', '/interactions/reviews', {
  ...buyerOpts, body: { productId: product.id, rating: 2, title: 'Tạm', body: 'Vải hơi mỏng' },
});
check('buyer creates review', rev.status === 201 && rev.json?.review?.id, `got ${rev.status} ${JSON.stringify(rev.json)?.slice(0, 200)}`);
const reviewId = rev.json?.review?.id;

let pub = await req('GET', `/interactions/reviews?productId=${product.id}`, { shopId: shop.id });
check('public sees published review', pub.json?.data?.length === 1, JSON.stringify(pub.json)?.slice(0, 200));

const adminList = await req('GET', '/interactions/reviews/admin', adminOpts);
check('admin list sees review', adminList.json?.data?.length === 1, JSON.stringify(adminList.json)?.slice(0, 300));
check('admin list joins product+customer', adminList.json?.data?.[0]?.product?.name === 'Áo thun E2E' && !!adminList.json?.data?.[0]?.customer?.email);

const buyerHide = await req('PATCH', `/interactions/reviews/${reviewId}/status`, { ...buyerOpts, body: { status: 'hidden' } });
check('buyer cannot moderate', buyerHide.status === 401 || buyerHide.status === 403, `got ${buyerHide.status}`);

const hide = await req('PATCH', `/interactions/reviews/${reviewId}/status`, { ...adminOpts, body: { status: 'hidden' } });
check('admin hides review', hide.json?.review?.status === 'hidden', JSON.stringify(hide.json)?.slice(0, 200));

pub = await req('GET', `/interactions/reviews?productId=${product.id}`, { shopId: shop.id });
check('hidden review gone from public', pub.json?.data?.length === 0, JSON.stringify(pub.json)?.slice(0, 200));

const hiddenList = await req('GET', '/interactions/reviews/admin?status=hidden', adminOpts);
check('admin filters by status=hidden', hiddenList.json?.data?.length === 1);

const badStatus = await req('PATCH', `/interactions/reviews/${reviewId}/status`, { ...adminOpts, body: { status: 'deleted' } });
check('invalid status rejected', badStatus.status === 400, `got ${badStatus.status}`);

const republish = await req('PATCH', `/interactions/reviews/${reviewId}/status`, { ...adminOpts, body: { status: 'published' } });
check('admin republishes', republish.json?.review?.status === 'published');

// ===== 8. Media delete =====
console.log('\n== 8. Media delete ==');
let minioUp = false;
try {
  const ping = await fetch('http://localhost:9000/minio/health/live');
  minioUp = ping.ok;
} catch {}

if (minioUp) {
  // 1x1 PNG
  const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const fd = new FormData();
  fd.append('file', new Blob([Buffer.from(pngB64, 'base64')], { type: 'image/png' }), 'e2e.png');
  const up = await req('POST', '/media/upload', { ...adminOpts, formData: fd });
  const mediaId = up.json?.data?.id;
  check('media upload', up.status === 201 && !!mediaId, `got ${up.status} ${JSON.stringify(up.json)?.slice(0, 200)}`);

  const shopAfterUp = await prisma.shop.findUnique({ where: { id: shop.id }, select: { storageUsedBytes: true } });
  check('storage incremented', shopAfterUp.storageUsedBytes > 0n, `got ${shopAfterUp.storageUsedBytes}`);

  const del = await req('DELETE', `/media/${mediaId}`, adminOpts);
  check('media delete 200', del.status === 200, `got ${del.status} ${JSON.stringify(del.json)?.slice(0, 200)}`);

  const shopAfterDel = await prisma.shop.findUnique({ where: { id: shop.id }, select: { storageUsedBytes: true } });
  check('storage refunded', shopAfterDel.storageUsedBytes === 0n, `got ${shopAfterDel.storageUsedBytes}`);

  const gone = await prisma.media.findUnique({ where: { id: mediaId } });
  check('media record gone', gone === null);

  const obj = await fetch(up.json?.data?.url);
  check('MinIO object gone', obj.status === 404, `got ${obj.status}`);

  const del2 = await req('DELETE', `/media/${mediaId}`, adminOpts);
  check('double delete 404', del2.status === 404, `got ${del2.status}`);
} else {
  console.log('  MinIO không chạy — test DELETE với record seed (xoá MinIO best-effort)');
  const seeded = await prisma.media.create({
    data: { shopId: shop.id, url: 'http://localhost:9000/shop-images/e2e.png', key: 'e2e.png', bucket: 'shop-images', mimeType: 'image/png', size: 1234 },
  });
  await prisma.shop.update({ where: { id: shop.id }, data: { storageUsedBytes: 1234 } });

  const del = await req('DELETE', `/media/${seeded.id}`, adminOpts);
  check('media delete 200 (MinIO down vẫn xoá record)', del.status === 200, `got ${del.status} ${JSON.stringify(del.json)?.slice(0, 200)}`);

  const shopAfterDel = await prisma.shop.findUnique({ where: { id: shop.id }, select: { storageUsedBytes: true } });
  check('storage refunded', shopAfterDel.storageUsedBytes === 0n, `got ${shopAfterDel.storageUsedBytes}`);

  const del2 = await req('DELETE', `/media/${seeded.id}`, adminOpts);
  check('double delete 404', del2.status === 404, `got ${del2.status}`);
}

const buyerDel = await req('DELETE', '/media/whatever', buyerOpts);
check('buyer cannot delete media', buyerDel.status === 401 || buyerDel.status === 403, `got ${buyerDel.status}`);

// ===== Cleanup =====
console.log('\n== Cleanup ==');
const shopIds = (await prisma.shop.findMany({ where: { domain: { startsWith: 'e2e-' } }, select: { id: true } })).map(s => s.id);
await prisma.payment.deleteMany({ where: { order: { shopId: { in: shopIds } } } });
await prisma.lineItem.deleteMany({ where: { order: { shopId: { in: shopIds } } } });
await prisma.order.deleteMany({ where: { shopId: { in: shopIds } } });
await prisma.productReview.deleteMany({ where: { shopId: { in: shopIds } } });
await prisma.notification.deleteMany({ where: { shopId: { in: shopIds } } }).catch(() => {});
await prisma.shop.deleteMany({ where: { id: { in: shopIds } } }); // cascade phần còn lại
await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e-owner-' } } });
console.log(`  fixture deleted (${shopIds.length} shop)`);

console.log(`\n===== KẾT QUẢ: ${passed} pass, ${failed} fail =====`);
await prisma.$disconnect();
process.exit(failed > 0 ? 1 : 0);
