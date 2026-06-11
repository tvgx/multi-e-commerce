// E2E test: shipping & wallet & analytics against a running api-core (port 3000).
// Creates its own owner/shop/product fixture — does not touch existing shops.
// Run: node scripts/e2e-shipping-wallet.mjs
import { PrismaClient } from '@prisma/client';

const API = 'http://localhost:3000/api';
const prisma = new PrismaClient();
const stamp = Date.now();

let passed = 0, failed = 0;
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${detail}`); }
}

async function req(method, path, { body, cookie, bearer, shopId } = {}) {
  const headers = { 'content-type': 'application/json', origin: 'http://localhost:3001' };
  if (cookie) headers.cookie = cookie;
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  if (shopId) headers['x-shop-id'] = shopId;
  const res = await fetch(`${API}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json, setCookie: res.headers.getSetCookie?.() ?? [] };
}

// ===== 1. Owner sign-up =====
console.log('\n== 1. Owner sign-up (better-auth) ==');
const ownerEmail = `e2e-owner-${stamp}@test.local`;
const signup = await req('POST', '/auth/owner/sign-up/email', {
  body: { email: ownerEmail, password: 'e2e-password-123', name: 'E2E Owner' },
});
check('owner sign-up 200', signup.status === 200, `got ${signup.status} ${JSON.stringify(signup.json)}`);
const ownerCookie = signup.setCookie.map(c => c.split(';')[0]).join('; ');
const ownerId = signup.json?.user?.id;
check('owner id returned', !!ownerId);
if (!ownerId) {
  console.log('Không tạo được owner — dừng test.');
  await prisma.$disconnect();
  process.exit(1);
}

// ===== 2. Seed shop fixture (DB) =====
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
console.log(`  shop=${shop.id}`);

// ===== 3. Buyer register =====
console.log('\n== 3. Buyer register (storefront-auth) ==');
const buyerEmail = `e2e-buyer-${stamp}@test.local`;
const reg = await req('POST', '/storefront-auth/register', {
  shopId: shop.id,
  body: { email: buyerEmail, password: 'buyer-pass-123', fullName: 'E2E Buyer' },
});
check('buyer register ok', reg.status < 300, `got ${reg.status} ${JSON.stringify(reg.json)}`);
const login = await req('POST', '/storefront-auth/login', {
  shopId: shop.id, body: { email: buyerEmail, password: 'buyer-pass-123' },
});
const buyerToken = login.json?.data?.token || login.json?.data?.accessToken || login.json?.token;
check('buyer login token', !!buyerToken, JSON.stringify(login.json));

// ===== 3b. Product search (storefront public + admin) =====
console.log('\n== 3b. Product search ==');
const draftProduct = await prisma.product.create({
  data: { shopId: shop.id, name: 'Quần jean DRAFT', slug: `quan-jean-${stamp}`, status: 'DRAFT' },
});

const pubByName = await req('GET', `/products/shop/${shop.id}?search=thun`, { shopId: shop.id });
check('public search by name', (pubByName.json?.data?.data || []).length === 1, JSON.stringify(pubByName.json)?.slice(0, 200));

const pubBySku = await req('GET', `/products/shop/${shop.id}?search=E2E-SKU`, { shopId: shop.id });
check('public search by SKU', (pubBySku.json?.data?.data || []).length === 1);

const pubMiss = await req('GET', `/products/shop/${shop.id}?search=khongtontai`, { shopId: shop.id });
check('public search no match', (pubMiss.json?.data?.data || []).length === 0);

const pubDraftHidden = await req('GET', `/products/shop/${shop.id}?search=jean`, { shopId: shop.id });
check('public search hides DRAFT', (pubDraftHidden.json?.data?.data || []).length === 0);

const pubAll = await req('GET', `/products/shop/${shop.id}`, { shopId: shop.id });
check('public list only PUBLISHED', (pubAll.json?.data?.data || []).length === 1);

const pubDetail = await req('GET', `/products/${draftProduct.id}`, { shopId: shop.id });
check('public DRAFT detail 404', pubDetail.status === 404, `got ${pubDetail.status}`);

// ===== 4. Admin: shipping methods CRUD =====
console.log('\n== 4. Admin shipping methods ==');
const adminOpts = { cookie: ownerCookie, shopId: shop.id };

const adminSearch = await req('GET', `/catalog/products/shop/${shop.id}?search=jean`, adminOpts);
check('admin search sees DRAFT', (adminSearch.json?.data?.data || []).length === 1, JSON.stringify(adminSearch.json)?.slice(0, 200));
const smCreate = await req('POST', '/shipping/methods', {
  ...adminOpts,
  body: { name: 'Giao tiêu chuẩn', baseFee: 30000, freeThreshold: 500000, estimatedDays: '2-4 ngày' },
});
check('create shipping method', smCreate.status === 201 && smCreate.json?.id, `got ${smCreate.status} ${JSON.stringify(smCreate.json)}`);
const smId = smCreate.json?.id;

const smUpdate = await req('PATCH', `/shipping/methods/${smId}`, { ...adminOpts, body: { baseFee: 25000 } });
check('update shipping method', smUpdate.status === 200 && smUpdate.json?.baseFee === 25000);

const smAll = await req('GET', '/shipping/methods/all', adminOpts);
check('list all methods', (smAll.json?.data || []).length === 1);

// ===== 5. Storefront: methods + quote =====
console.log('\n== 5. Storefront shipping quote ==');
const smPublic = await req('GET', '/shipping/methods', { shopId: shop.id });
check('public methods list', (smPublic.json?.data || []).length === 1);

const quote1 = await req('POST', '/shipping/quote', { shopId: shop.id, body: { shippingMethodId: smId, subtotal: 150000 } });
check('quote below threshold = 25000', quote1.json?.fee === 25000, JSON.stringify(quote1.json));
const quote2 = await req('POST', '/shipping/quote', { shopId: shop.id, body: { shippingMethodId: smId, subtotal: 600000 } });
check('quote above threshold = 0 (freeship)', quote2.json?.fee === 0, JSON.stringify(quote2.json));

// ===== 6. Wallet payment method + topup =====
console.log('\n== 6. Wallet topup flow ==');
const pmToggle = await req('POST', '/wallet/admin/payment-method', { ...adminOpts, body: { active: true } });
check('enable wallet payment method', pmToggle.status === 201 && pmToggle.json?.type === 'Wallet', JSON.stringify(pmToggle.json));
const walletPmId = pmToggle.json?.id;

const buyerOpts = { bearer: buyerToken, shopId: shop.id };
const w0 = await req('GET', '/wallet/me', buyerOpts);
check('wallet starts at 0', w0.json?.balance === 0, JSON.stringify(w0.json));

const topup = await req('POST', '/wallet/topup', { ...buyerOpts, body: { amount: 500000 } });
check('topup request created', topup.status === 201 && !!topup.json?.token, JSON.stringify(topup.json)?.slice(0, 200));
const topupToken = topup.json?.token;
check('topup has confirmUrl + QR', !!topup.json?.confirmUrl && !!topup.json?.qrCodeUrl);

const tInfo = await req('GET', `/wallet/topup/token/${topupToken}`);
check('topup token info', tInfo.json?.amount === 500000, JSON.stringify(tInfo.json));

const tConfirm = await req('POST', `/wallet/topup/confirm/${topupToken}`, { body: { action: 'confirm' } });
check('topup confirm', tConfirm.json?.success === true, JSON.stringify(tConfirm.json));

const tConfirm2 = await req('POST', `/wallet/topup/confirm/${topupToken}`, { body: { action: 'confirm' } });
check('double-confirm rejected', tConfirm2.status === 400, `got ${tConfirm2.status}`);

const w1 = await req('GET', '/wallet/me', buyerOpts);
check('balance = 500000 after topup', w1.json?.balance === 500000, JSON.stringify(w1.json));

// ===== 7. Checkout paid by wallet, with shipping =====
console.log('\n== 7. Checkout (wallet + shipping) ==');
const checkout = await req('POST', '/orders/checkout', {
  ...buyerOpts,
  body: {
    paymentMethodId: walletPmId,
    lineItems: [{ variantId: variant.id, quantity: 2 }],
    shippingMethodId: smId,
    shippingAddress: { fullName: 'E2E Buyer', phone: '0900000000', addressLine1: '1 Đường Test', city: 'HCM', province: 'HCM' },
  },
});
const order = checkout.json;
// subtotal 300000 < freeThreshold 500000 → ship 25000 → total 325000
check('checkout created', checkout.status === 201, `got ${checkout.status} ${JSON.stringify(order)?.slice(0, 300)}`);
check('order total = 325000 (300k + 25k ship)', order?.totalAmount === 325000, `got ${order?.totalAmount}`);
check('order state confirmed (wallet paid)', order?.state === 'confirmed', `got ${order?.state}`);
check('paymentState paid', order?.paymentState === 'paid', `got ${order?.paymentState}`);

const w2 = await req('GET', '/wallet/me', buyerOpts);
check('balance = 175000 after payment', w2.json?.balance === 175000, JSON.stringify(w2.json?.balance));

const txs = await req('GET', '/wallet/me/transactions', buyerOpts);
const txTypes = (txs.json?.data || []).map(t => t.type);
check('transactions: payment + deposit', txTypes.includes('payment') && txTypes.includes('deposit'), JSON.stringify(txTypes));

// Insufficient balance check
const tooBig = await req('POST', '/orders/checkout', {
  ...buyerOpts,
  body: { paymentMethodId: walletPmId, lineItems: [{ variantId: variant.id, quantity: 10 }] },
});
check('insufficient balance rejected', tooBig.status === 400, `got ${tooBig.status} ${JSON.stringify(tooBig.json)?.slice(0, 150)}`);
const w2b = await req('GET', '/wallet/me', buyerOpts);
check('balance unchanged after failed checkout', w2b.json?.balance === 175000, `got ${w2b.json?.balance}`);

// ===== 8. Shipment fulfillment =====
console.log('\n== 8. Shipment fulfillment ==');
const track0 = await req('GET', `/shipping/track/${order.id}`, buyerOpts);
check('buyer can track order', (track0.json?.shipments || []).length === 1, JSON.stringify(track0.json)?.slice(0, 200));
const shipmentId = track0.json?.shipments?.[0]?.id;

const badTransition = await req('PATCH', `/shipping/shipments/${shipmentId}`, { ...adminOpts, body: { state: 'delivered' } });
check('invalid transition pending->delivered rejected', badTransition.status === 400, `got ${badTransition.status}`);

const ship = await req('PATCH', `/shipping/shipments/${shipmentId}`, {
  ...adminOpts, body: { state: 'shipped', carrier: 'GHN', trackingNumber: `TRK-${stamp}` },
});
check('mark shipped', ship.status === 200 && ship.json?.state === 'shipped', JSON.stringify(ship.json)?.slice(0, 200));

const orderAfterShip = await req('GET', `/orders/${order.id}`, adminOpts);
check('order state synced to shipped', orderAfterShip.json?.state === 'shipped', `got ${orderAfterShip.json?.state}`);
check('order shipmentState shipped', orderAfterShip.json?.shipmentState === 'shipped', `got ${orderAfterShip.json?.shipmentState}`);

const deliver = await req('PATCH', `/shipping/shipments/${shipmentId}`, { ...adminOpts, body: { state: 'delivered' } });
check('mark delivered', deliver.json?.state === 'delivered');

// ===== 9. Refund to wallet =====
console.log('\n== 9. Refund ==');
const refund = await req('POST', `/orders/${order.id}/refund`, adminOpts);
check('refund ok', refund.status === 201 && refund.json?.paymentState === 'refunded', `got ${refund.status} ${JSON.stringify(refund.json)?.slice(0, 200)}`);

const w3 = await req('GET', '/wallet/me', buyerOpts);
check('balance = 500000 after refund', w3.json?.balance === 500000, `got ${w3.json?.balance}`);

const refund2 = await req('POST', `/orders/${order.id}/refund`, adminOpts);
check('double refund rejected', refund2.status === 400, `got ${refund2.status}`);

// ===== 10. Admin wallet views =====
console.log('\n== 10. Admin wallet views ==');
const wl = await req('GET', '/wallet/admin/wallets', adminOpts);
check('admin lists wallets', (wl.json?.data || []).length === 1, JSON.stringify(wl.json?.data)?.slice(0, 200));
const walletId = wl.json?.data?.[0]?.id;

const wtx = await req('GET', `/wallet/admin/wallets/${walletId}/transactions`, adminOpts);
check('admin wallet transactions (3: deposit/payment/refund)', (wtx.json?.data || []).length === 3, `got ${(wtx.json?.data || []).length}`);

const adj = await req('POST', '/wallet/admin/adjust', { ...adminOpts, body: { customerId: wl.json.data[0].customerId, amount: -100000, note: 'E2E adjust' } });
check('admin adjust -100000', adj.status === 201 && adj.json?.balance === 400000, `got ${adj.status} ${JSON.stringify(adj.json)?.slice(0, 150)}`);

const topups = await req('GET', '/wallet/admin/topups', adminOpts);
check('admin topup list', (topups.json?.data || []).length === 1);

// ===== 11. Analytics =====
console.log('\n== 11. Analytics ==');
for (const ep of ['dashboard', 'summary', 'revenue', 'orders-by-status', 'top-products', 'customers']) {
  const r = await req('GET', `/analytics/${ep}?period=30d`, adminOpts);
  check(`analytics/${ep} 200`, r.status === 200, `got ${r.status} ${JSON.stringify(r.json)?.slice(0, 150)}`);
}
const summary = await req('GET', '/analytics/summary?period=30d', adminOpts);
console.log('  summary:', JSON.stringify(summary.json)?.slice(0, 300));

const platform = await req('GET', '/analytics/platform/summary?period=30d', { cookie: ownerCookie });
check('analytics/platform/summary 200', platform.status === 200, `got ${platform.status} ${JSON.stringify(platform.json)?.slice(0, 150)}`);

// ===== Cleanup =====
console.log('\n== Cleanup ==');
// Order không có onDelete cascade về Shop nên phải xoá con trước
const shopIds = (await prisma.shop.findMany({ where: { domain: { startsWith: 'e2e-' } }, select: { id: true } })).map(s => s.id);
await prisma.payment.deleteMany({ where: { order: { shopId: { in: shopIds } } } });
await prisma.lineItem.deleteMany({ where: { order: { shopId: { in: shopIds } } } });
await prisma.order.deleteMany({ where: { shopId: { in: shopIds } } });
await prisma.notification.deleteMany({ where: { shopId: { in: shopIds } } }).catch(() => {});
await prisma.shop.deleteMany({ where: { id: { in: shopIds } } }); // cascade phần còn lại
await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e-owner-' } } });
console.log(`  fixture deleted (${shopIds.length} shop)`);

console.log(`\n===== KẾT QUẢ: ${passed} pass, ${failed} fail =====`);
await prisma.$disconnect();
process.exit(failed > 0 ? 1 : 0);
