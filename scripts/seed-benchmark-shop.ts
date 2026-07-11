/**
 * Seed dữ liệu demo/benchmark cho dashboard analytics của MỘT shop (TODO 20).
 *
 * Bơm các bảng mà analytics.service đọc: orders + line_items (doanh thu, top
 * sản phẩm, timing), customers, shop_visits (traffic/funnel), product_reviews,
 * search_history, và đơn state='cart' (giỏ bỏ quên trong funnel). Timestamps
 * trải đều DAYS ngày gần nhất với trend tăng nhẹ để chart đẹp.
 *
 * Shop PHẢI có sẵn products/variants (chạy seed-electronics-shop.ts trước nếu chưa).
 *
 * Chạy:
 *   npx tsx scripts/seed-benchmark-shop.ts <shopId> [--days=90] [--orders=300] [--dry-run] [--clean]
 *
 * Mọi bản ghi seed đánh dấu được để gỡ: customer email *@bench.local, order
 * number BENCH-*, visit path '/bench', search query có sẵn danh sách cố định.
 * `--clean` xoá toàn bộ dữ liệu bench cũ của shop rồi thoát.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const SHOP_ID = args.find((a) => !a.startsWith('--'));
const DAYS = Number((args.find((a) => a.startsWith('--days=')) || '').split('=')[1]) || 90;
const ORDER_COUNT = Number((args.find((a) => a.startsWith('--orders=')) || '').split('=')[1]) || 300;
const DRY_RUN = args.includes('--dry-run');
const CLEAN = args.includes('--clean');

if (!SHOP_ID) {
  console.error('Usage: npx tsx scripts/seed-benchmark-shop.ts <shopId> [--days=90] [--orders=300] [--dry-run] [--clean]');
  process.exit(1);
}

const CUSTOMER_COUNT = 60;
const VISIT_COUNT = 2200;
const REVIEW_COUNT = 80;
const SEARCH_COUNT = 150;
const ABANDONED_CART_COUNT = 90;

const FIRST = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hùng', 'Lan', 'Minh', 'Nam', 'Ngọc', 'Phúc', 'Quân', 'Thảo', 'Trang', 'Tuấn', 'Vy', 'Yến'];
const LAST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
const SEARCH_QUERIES = ['tai nghe', 'áo thun', 'giày sneaker', 'laptop', 'chuột gaming', 'bàn phím cơ', 'sạc nhanh', 'ốp lưng', 'loa bluetooth', 'màn hình', 'balo', 'đồng hồ'];

// Đơn không tính doanh thu: 'cart', 'canceled' (NON_REVENUE_STATES của analytics.service)
const ORDER_STATE_WEIGHTS: [string, string, number][] = [
  // [state, paymentState, weight]
  ['completed', 'paid', 40],
  ['delivered', 'paid', 20],
  ['shipped', 'paid', 10],
  ['processing', 'paid', 8],
  ['confirmed', 'balance_due', 12],
  ['canceled', 'void', 10],
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weighted(): [string, string] {
  const total = ORDER_STATE_WEIGHTS.reduce((a, [, , w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [s, p, w] of ORDER_STATE_WEIGHTS) {
    if ((r -= w) <= 0) return [s, p];
  }
  return ['completed', 'paid'];
}

/** Ngày ngẫu nhiên trong DAYS ngày qua, thiên về gần đây (trend tăng). */
function trendDate(): Date {
  // bias^0.6 dồn mật độ về cuối kỳ
  const bias = Math.pow(Math.random(), 0.6);
  const daysAgo = (1 - bias) * DAYS;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  // Giờ đặt hàng thiên về 9-22h
  d.setHours(9 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function clean() {
  const benchOrders = await prisma.order.findMany({
    where: { shopId: SHOP_ID, number: { startsWith: 'BENCH-' } },
    select: { id: true },
  });
  const orderIds = benchOrders.map((o) => o.id);
  const li = await prisma.lineItem.deleteMany({ where: { orderId: { in: orderIds } } });
  const or = await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  const rv = await prisma.productReview.deleteMany({
    where: { shopId: SHOP_ID, customerId: { in: (await benchCustomerIds()) } },
  });
  const sh = await prisma.searchHistory.deleteMany({
    where: { shopId: SHOP_ID, customerId: { in: (await benchCustomerIds()) } },
  });
  const vs = await prisma.shopVisit.deleteMany({ where: { shopId: SHOP_ID, path: '/bench' } });
  const cs = await prisma.customer.deleteMany({
    where: { shopId: SHOP_ID, email: { endsWith: '@bench.local' } },
  });
  console.log('Cleaned:', { lineItems: li.count, orders: or.count, reviews: rv.count, searches: sh.count, visits: vs.count, customers: cs.count });
}

async function benchCustomerIds(): Promise<string[]> {
  const rows = await prisma.customer.findMany({
    where: { shopId: SHOP_ID, email: { endsWith: '@bench.local' } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function main() {
  const shop = await prisma.shop.findUnique({ where: { id: SHOP_ID }, select: { id: true, name: true } });
  if (!shop) throw new Error(`Shop ${SHOP_ID} not found`);
  console.log(`Shop: ${shop.name} (${SHOP_ID}) — days=${DAYS} orders=${ORDER_COUNT} dryRun=${DRY_RUN}`);

  if (CLEAN) {
    if (DRY_RUN) { console.log('(dry-run) would clean bench data'); return; }
    await clean();
    return;
  }

  const variants = await prisma.variant.findMany({
    where: { shopId: SHOP_ID, product: { status: 'PUBLISHED' } },
    select: { id: true, price: true, productId: true },
  });
  if (variants.length === 0) {
    throw new Error('Shop has no PUBLISHED variants — seed products first (seed-electronics-shop.ts)');
  }
  console.log(`Found ${variants.length} variants`);

  if (DRY_RUN) {
    console.log(`(dry-run) would create ~${CUSTOMER_COUNT} customers, ${VISIT_COUNT} visits, ${ORDER_COUNT} orders (+${ABANDONED_CART_COUNT} abandoned), ${REVIEW_COUNT} reviews, ${SEARCH_COUNT} searches`);
    return;
  }

  // 1) Customers
  const now = new Date();
  const customers = Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
    const created = trendDate();
    return {
      id: randomUUID(),
      shopId: SHOP_ID!,
      email: `khach${i + 1}@bench.local`,
      name: `${pick(LAST)} ${pick(FIRST)}`,
      emailVerified: true,
      createdAt: created,
      updatedAt: created,
    };
  });
  await prisma.customer.createMany({ data: customers, skipDuplicates: true });
  console.log(`Customers: +${customers.length}`);

  // 2) Visits — mỗi khách 1 visitorId; thêm khách vãng lai; ~12% quay lại nhiều phiên
  const visitorIds = [
    ...customers.map((c) => ({ visitorId: randomUUID(), customerId: c.id as string | null })),
    ...Array.from({ length: 320 }, () => ({ visitorId: randomUUID(), customerId: null as string | null })),
  ];
  const visits = Array.from({ length: VISIT_COUNT }, () => {
    const v = pick(visitorIds);
    return {
      id: randomUUID(),
      shopId: SHOP_ID!,
      visitorId: v.visitorId,
      customerId: v.customerId,
      path: '/bench',
      createdAt: trendDate(),
    };
  });
  await prisma.shopVisit.createMany({ data: visits });
  console.log(`Visits: +${visits.length}`);

  // 3) Orders + line items
  const runTag = Date.now().toString(36);
  const orderRows: any[] = [];
  const lineRows: any[] = [];
  for (let i = 0; i < ORDER_COUNT + ABANDONED_CART_COUNT; i++) {
    const abandoned = i >= ORDER_COUNT;
    const [state, paymentState] = abandoned ? ['cart', 'balance_due'] : weighted();
    const customer = pick(customers);
    const created = trendDate();
    const orderId = randomUUID();

    const itemCount = 1 + Math.floor(Math.random() * 3);
    let itemTotal = 0;
    for (let k = 0; k < itemCount; k++) {
      const variant = pick(variants);
      const qty = 1 + Math.floor(Math.random() * 3);
      itemTotal += variant.price * qty;
      lineRows.push({
        id: randomUUID(),
        orderId,
        variantId: variant.id,
        quantity: qty,
        price: variant.price,
      });
    }
    const shipmentTotal = itemTotal >= 500_000 ? 0 : 30_000;

    orderRows.push({
      id: orderId,
      number: `BENCH-${runTag}-${i + 1}`,
      shopId: SHOP_ID!,
      customerId: customer.id,
      state,
      paymentState,
      shipmentState: state === 'completed' || state === 'delivered' ? 'shipped' : 'pending',
      itemTotal,
      shipmentTotal,
      totalAmount: itemTotal + shipmentTotal,
      currency: 'VND',
      createdAt: created,
      updatedAt: created,
    });
  }
  // createMany theo batch để tránh transaction dài trên pooler transaction-mode
  for (let i = 0; i < orderRows.length; i += 100) {
    await prisma.order.createMany({ data: orderRows.slice(i, i + 100) });
  }
  for (let i = 0; i < lineRows.length; i += 200) {
    await prisma.lineItem.createMany({ data: lineRows.slice(i, i + 200) });
  }
  console.log(`Orders: +${orderRows.length} (in đó ${ABANDONED_CART_COUNT} giỏ bỏ quên) — LineItems: +${lineRows.length}`);

  // 4) Reviews — khách + sản phẩm thật, rating thiên 4-5
  const productIds = [...new Set(variants.map((v) => v.productId))];
  const reviews = Array.from({ length: REVIEW_COUNT }, () => {
    const created = trendDate();
    return {
      id: randomUUID(),
      shopId: SHOP_ID!,
      customerId: pick(customers).id,
      productId: pick(productIds),
      rating: pick([3, 4, 4, 5, 5, 5]),
      body: pick([
        'Sản phẩm tốt, giao hàng nhanh.',
        'Chất lượng ổn so với giá tiền.',
        'Rất hài lòng, sẽ ủng hộ shop tiếp.',
        'Đóng gói cẩn thận, đúng mô tả.',
        'Dùng một tuần thấy ổn định.',
      ]),
      status: 'published',
      createdAt: created,
      updatedAt: created,
    };
  });
  await prisma.productReview.createMany({ data: reviews });
  console.log(`Reviews: +${reviews.length}`);

  // 5) Search history
  const searches = Array.from({ length: SEARCH_COUNT }, () => ({
    id: randomUUID(),
    shopId: SHOP_ID!,
    customerId: pick(customers).id,
    query: pick(SEARCH_QUERIES),
    createdAt: trendDate(),
  }));
  await prisma.searchHistory.createMany({ data: searches });
  console.log(`Searches: +${searches.length}`);

  console.log(`\nDone — mở dashboard analytics của shop để xem số liệu ${DAYS} ngày.`);
  console.log(`Gỡ data demo: npx tsx scripts/seed-benchmark-shop.ts ${SHOP_ID} --clean`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
