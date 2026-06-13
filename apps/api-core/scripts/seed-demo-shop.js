/**
 * Seed dữ liệu demo cho một shop có sẵn:
 *   - 5 danh mục (Category + Collection cùng tên, kèm ảnh)
 *   - 50 sản phẩm PUBLISHED: ảnh MinIO shop-public/<shopId>/<productId>-N.jpg,
 *     variant + giá VND, tồn kho (StockItem), reviews 3–5 sao từ khách demo
 *
 * Chạy:  node scripts/seed-demo-shop.js <shopId>
 * Script chỉ THÊM dữ liệu — không sửa/xoá dữ liệu sẵn có. Slug trùng sẽ bị bỏ qua.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { randomUUID } = require('node:crypto');

const SHOP_ID = process.argv[2] || 'aee86ef6-de37-49bb-8865-1c6c3d5ff06e';
const PUBLIC_BUCKET = 'shop-public';
const CDN = process.env.CDN_BASE_URL || 'http://localhost:9000';

const prisma = new PrismaClient();
const s3 = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

// ───────────────────────── dữ liệu mẫu (shop thời trang) ─────────────────────────
const CATEGORIES = [
  { name: 'Áo thun', slug: 'ao-thun', description: 'Áo thun cotton thoáng mát, form chuẩn, dễ phối đồ.', hue: 200 },
  { name: 'Sơ mi', slug: 'so-mi', description: 'Sơ mi công sở và dạo phố, chất vải mềm chống nhăn.', hue: 30 },
  { name: 'Quần jeans', slug: 'quan-jeans', description: 'Jeans co giãn nhẹ, bền màu, nhiều phom dáng.', hue: 220 },
  { name: 'Váy đầm', slug: 'vay-dam', description: 'Váy đầm thanh lịch cho mọi dịp, từ đi làm tới dự tiệc.', hue: 330 },
  { name: 'Phụ kiện', slug: 'phu-kien', description: 'Túi, nón, thắt lưng và phụ kiện hoàn thiện outfit.', hue: 130 },
];

const NAME_POOLS = {
  'ao-thun': ['Áo thun trơn Premium Cotton', 'Áo thun oversize Street', 'Áo thun polo Classic', 'Áo thun graphic Minimal', 'Áo thun raglan thể thao', 'Áo thun cổ tròn Basic', 'Áo thun dáng rộng Unisex', 'Áo thun kẻ sọc Marine', 'Áo thun nữ croptop', 'Áo thun organic Eco'],
  'so-mi': ['Sơ mi trắng công sở', 'Sơ mi flannel kẻ caro', 'Sơ mi denim bụi bặm', 'Sơ mi linen tay ngắn', 'Sơ mi Oxford Slim-fit', 'Sơ mi lụa nữ thanh lịch', 'Sơ mi cuban vintage', 'Sơ mi dáng suông Hàn Quốc', 'Sơ mi caro nâu trầm', 'Sơ mi trễ vai nữ'],
  'quan-jeans': ['Quần jeans slim-fit xanh đậm', 'Quần jeans baggy Unisex', 'Quần jeans rách gối Street', 'Quần jeans ống đứng Classic', 'Quần jeans lưng cao nữ', 'Quần jeans wash sáng', 'Quần short jeans mùa hè', 'Quần jeans đen Skinny', 'Quần jeans ống loe Retro', 'Quần jeans straight Cool'],
  'vay-dam': ['Đầm maxi đi biển', 'Váy hoa nhí vintage', 'Đầm bodycon dự tiệc', 'Váy sơ mi dáng suông', 'Đầm hai dây lụa satin', 'Váy xếp ly midi', 'Đầm tweed sang trọng', 'Váy denim trẻ trung', 'Đầm trễ vai nữ tính', 'Váy len ôm mùa đông'],
  'phu-kien': ['Túi tote canvas', 'Nón bucket thêu logo', 'Thắt lưng da bò Classic', 'Khăn lụa vuông in hoạ tiết', 'Túi đeo chéo mini', 'Nón lưỡi trai Basic', 'Vớ cotton cổ cao (set 3)', 'Kính mát gọng vuông', 'Ví da gập đôi', 'Băng đô vải nữ'],
};

const REVIEW_TITLES = ['Rất đáng tiền', 'Chất lượng tốt', 'Sẽ mua lại', 'Hài lòng', 'Đẹp như hình', 'Giao hàng nhanh', 'Form chuẩn', 'Vải mát, đường may đẹp'];
const REVIEW_BODIES = [
  'Chất vải dày dặn, mặc thoải mái, đúng mô tả của shop.',
  'Giao hàng nhanh, đóng gói cẩn thận. Màu sắc giống hình.',
  'Form chuẩn, lên dáng đẹp. Bạn bè khen suốt.',
  'Giá này mà chất lượng vậy là quá ổn, sẽ ủng hộ tiếp.',
  'Đường may chắc chắn, không chỉ thừa. Rất hài lòng.',
  'Mặc lên rất tôn dáng, shop tư vấn size nhiệt tình.',
  'Sản phẩm ổn trong tầm giá, giặt máy không bị giãn.',
  'Mua lần hai rồi, chất lượng đồng đều, đáng tin.',
];

const CUSTOMER_NAMES = ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Cường', 'Phạm Thu Dung', 'Hoàng Minh Đức', 'Vũ Ngọc Hà', 'Đặng Quang Huy', 'Bùi Thanh Lan', 'Đỗ Hữu Nam', 'Ngô Yến Nhi', 'Dương Tấn Phát', 'Lý Cẩm Tú'];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const noDiacritics = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const daysAgo = (n) => new Date(Date.now() - n * 86400000 - rand(0, 86400000));

// Ảnh demo: gradient + hoạ tiết tròn + tên sản phẩm (bỏ dấu để khỏi lỗi font)
async function makeImage(label, hue, variantSeed) {
  const h1 = (hue + variantSeed * 17) % 360;
  const h2 = (h1 + 40) % 360;
  const svg = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${h1},70%,82%)"/>
      <stop offset="100%" stop-color="hsl(${h2},65%,62%)"/>
    </linearGradient></defs>
    <rect width="800" height="800" fill="url(#g)"/>
    <circle cx="${rand(80, 280)}" cy="${rand(80, 260)}" r="${rand(60, 130)}" fill="hsl(${h2},70%,90%)" opacity="0.55"/>
    <circle cx="${rand(480, 720)}" cy="${rand(480, 700)}" r="${rand(90, 180)}" fill="hsl(${h1},70%,40%)" opacity="0.25"/>
    <rect x="60" y="600" width="680" height="130" rx="18" fill="rgba(0,0,0,0.45)"/>
    <text x="400" y="655" font-family="DejaVu Sans, Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">${noDiacritics(label).slice(0, 32)}</text>
    <text x="400" y="700" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" fill="#e2e8f0" text-anchor="middle">Demo product photo ${variantSeed}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
}

async function uploadImage(key, buffer) {
  await s3.send(new PutObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key, Body: buffer, ContentType: 'image/jpeg' }));
  return `${CDN}/${PUBLIC_BUCKET}/${key}`;
}

async function main() {
  const shop = await prisma.shop.findUnique({ where: { id: SHOP_ID } });
  if (!shop) throw new Error(`Shop ${SHOP_ID} không tồn tại`);
  console.log(`Seed cho shop "${shop.name}" (${shop.domain || SHOP_ID})`);

  // Slug-dedup ở mỗi sản phẩm tự chống nhân đôi, nên chạy lại an toàn (chỉ bù
  // phần còn thiếu). Chỉ chặn khi đã đủ bộ demo để khỏi chạy thừa.
  const existing = await prisma.product.count({ where: { shopId: SHOP_ID } });
  if (existing >= 51) throw new Error(`Shop đã có ${existing} sản phẩm — bộ demo đã đầy đủ, dừng.`);

  // 1. Kho mặc định
  let location = await prisma.stockLocation.findFirst({ where: { shopId: SHOP_ID, isDefault: true } })
    || await prisma.stockLocation.findFirst({ where: { shopId: SHOP_ID } });
  if (!location) {
    location = await prisma.stockLocation.create({
      data: { shopId: SHOP_ID, name: 'Kho chính', adminName: 'Kho chính', isDefault: true },
    });
    console.log('Tạo kho mặc định');
  }

  // 2. Khách demo cho reviews
  const customers = [];
  for (const name of CUSTOMER_NAMES) {
    const email = `${noDiacritics(name).toLowerCase().replace(/\s+/g, '.')}@demo.local`;
    const c = await prisma.customer.upsert({
      where: { shopId_email: { shopId: SHOP_ID, email } },
      update: {},
      create: { shopId: SHOP_ID, email, name, emailVerified: true },
    });
    customers.push(c);
  }
  console.log(`Khách demo: ${customers.length}`);

  let totalBytes = 0;
  let mediaCount = 0;
  let productCount = 0;
  let reviewCount = 0;

  // 3. Danh mục: Category (filter/catalog) + Collection (nav/admin) cùng nội dung
  for (const [ci, cat] of CATEGORIES.entries()) {
    const catImgBuf = await makeImage(cat.name, cat.hue, 0);
    const catImgUrl = await uploadImage(`${SHOP_ID}/${randomUUID()}.jpg`, catImgBuf);
    totalBytes += catImgBuf.length;
    mediaCount += 1;

    const category = await prisma.category.upsert({
      where: { shopId_slug: { shopId: SHOP_ID, slug: cat.slug } },
      update: {},
      create: { shopId: SHOP_ID, name: cat.name, slug: cat.slug, description: cat.description, imageUrl: catImgUrl, position: ci, isActive: true },
    });
    const collection = await prisma.collection.upsert({
      where: { shopId_slug: { shopId: SHOP_ID, slug: cat.slug } },
      update: {},
      create: { shopId: SHOP_ID, title: cat.name, slug: cat.slug, description: cat.description, imageUrl: catImgUrl, isActive: true },
    });

    // 4. 10 sản phẩm / danh mục
    for (const [pi, name] of NAME_POOLS[cat.slug].entries()) {
      const slug = `${noDiacritics(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      const dup = await prisma.product.findUnique({ where: { shopId_slug: { shopId: SHOP_ID, slug } } });
      if (dup) { console.log(`  bỏ qua (slug trùng): ${slug}`); continue; }

      const price = rand(99, 1190) * 1000; // 99k – 1.19M VND
      const product = await prisma.product.create({
        data: {
          shopId: SHOP_ID,
          name,
          slug,
          description: `${name} — ${cat.description} Chất liệu chọn lọc, bảo hành đổi trả 30 ngày.`,
          status: 'PUBLISHED',
          categoryId: category.id,
          createdAt: daysAgo(rand(1, 30)),
        },
      });

      // Ảnh: 2-3 tấm, tên <productId>-N.jpg trong folder shop
      const imgUrls = [];
      const imgTotal = rand(2, 3);
      for (let n = 1; n <= imgTotal; n++) {
        const buf = await makeImage(name, cat.hue, n);
        const key = `${SHOP_ID}/${product.id}-${n}.jpg`;
        const url = await uploadImage(key, buf);
        imgUrls.push(url);
        totalBytes += buf.length;
        mediaCount += 1;
        await prisma.media.create({
          data: { shopId: SHOP_ID, url, key, bucket: PUBLIC_BUCKET, mimeType: 'image/jpeg', size: buf.length, width: 800, height: 800, alt: name },
        });
      }

      const variant = await prisma.variant.create({
        data: { shopId: SHOP_ID, productId: product.id, sku: `SP-${slug.slice(0, 24)}-${pi + 1}`, price, currency: 'VND', isMaster: true, weight: rand(2, 12) / 10 },
      });
      await prisma.stockItem.create({
        data: { stockLocationId: location.id, variantId: variant.id, countOnHand: rand(8, 120) },
      });
      await prisma.productCollection.create({ data: { productId: product.id, collectionId: collection.id } });
      await prisma.product.update({
        where: { id: product.id },
        data: { images: imgUrls, imageUrl: imgUrls[0] },
      });

      // Reviews 0-8, thiên 4-5 sao
      const nReviews = rand(0, 8);
      for (let r = 0; r < nReviews; r++) {
        await prisma.productReview.create({
          data: {
            shopId: SHOP_ID,
            productId: product.id,
            customerId: pick(customers).id,
            rating: pick([3, 4, 4, 5, 5, 5]),
            title: pick(REVIEW_TITLES),
            body: pick(REVIEW_BODIES),
            status: 'published',
            createdAt: daysAgo(rand(0, 25)),
          },
        });
        reviewCount += 1;
      }

      productCount += 1;
      process.stdout.write(`\r  ${cat.name}: ${pi + 1}/10 (tổng ${productCount}/50)   `);
    }
    console.log();
  }

  // 5. Cộng dồn dung lượng lưu trữ
  await prisma.shop.update({
    where: { id: SHOP_ID },
    data: { storageUsedBytes: { increment: totalBytes }, storageChunkCount: { increment: mediaCount } },
  });

  console.log(`\nXong: ${productCount} sản phẩm, 5 danh mục, ${reviewCount} reviews, ${mediaCount} ảnh (${(totalBytes / 1024 / 1024).toFixed(1)} MB).`);
  console.log(`Demo: http://localhost:3002/${shop.domain || SHOP_ID}`);
}

main()
  .catch((e) => { console.error('\nSeed lỗi:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
