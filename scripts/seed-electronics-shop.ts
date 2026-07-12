/**
 * Seed ~50 sản phẩm điện tử vào 5 categories cho một shop, kèm ảnh self-host MinIO.
 *
 * Ảnh: tải thật từ loremflickr theo keyword ngành hàng rồi upload lên bucket
 * `shop-public` với key `<shopId>/<productId>-<n>.jpg` — đúng convention media.service
 * (URL = `${CDN_BASE_URL}/shop-public/<key>`). Bucket được áp policy public-read
 * idempotent giống MinioService để storefront không bị 403.
 *
 * Chạy:  npx tsx scripts/seed-electronics-shop.ts [shopId]
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

const SHOP_ID = process.argv[2] || '2935f8bc-1924-4d52-9fb6-23849aec2927';
// --keep: KHÔNG dọn catalog cũ — dùng khi shop đã có đơn hàng thật (xoá product
// dính line_items sẽ vỡ FK), chỉ bổ sung thêm sản phẩm mới.
const KEEP_EXISTING = process.argv.includes('--keep');
const PUBLIC_BUCKET = 'shop-public';
const IMAGES_PER_PRODUCT = 2;

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'localhost';
const MINIO_PORT = process.env.MINIO_PORT ?? '9000';
const CDN_BASE_URL =
  process.env.CDN_BASE_URL ?? `http://${MINIO_ENDPOINT}:${MINIO_PORT}`;

const s3 = new S3Client({
  endpoint: `http://${MINIO_ENDPOINT}:${MINIO_PORT}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  },
  forcePathStyle: true,
  maxAttempts: 3,
});

// ---- Dữ liệu danh mục + sản phẩm (giá VND) -------------------------------
type ProductSeed = { name: string; price: number };
type CategorySeed = {
  name: string;
  slug: string;
  keyword: string; // keyword loremflickr cho ảnh đúng ngành
  products: ProductSeed[];
};

const CATEGORIES: CategorySeed[] = [
  {
    name: 'Điện thoại',
    slug: 'dien-thoai',
    keyword: 'smartphone',
    products: [
      { name: 'iPhone 15 Pro Max 256GB', price: 32990000 },
      { name: 'Samsung Galaxy S24 Ultra', price: 29990000 },
      { name: 'Google Pixel 8 Pro', price: 23990000 },
      { name: 'Xiaomi 14 5G', price: 18990000 },
      { name: 'OPPO Find X7 Ultra', price: 21990000 },
      { name: 'vivo X100 Pro', price: 19990000 },
      { name: 'OnePlus 12 5G', price: 17990000 },
      { name: 'Realme GT5 Pro', price: 13990000 },
      { name: 'Nothing Phone (2)', price: 12990000 },
      { name: 'ASUS ROG Phone 8 Pro', price: 26990000 },
    ],
  },
  {
    name: 'Laptop',
    slug: 'laptop',
    keyword: 'laptop',
    products: [
      { name: 'MacBook Pro 14" M3 Pro', price: 49990000 },
      { name: 'MacBook Air 15" M2', price: 32990000 },
      { name: 'Dell XPS 13 Plus', price: 38990000 },
      { name: 'ASUS ZenBook 14 OLED', price: 24990000 },
      { name: 'Lenovo ThinkPad X1 Carbon', price: 42990000 },
      { name: 'HP Spectre x360 14', price: 36990000 },
      { name: 'Acer Swift Go 14', price: 18990000 },
      { name: 'MSI Prestige 16 AI', price: 33990000 },
      { name: 'LG Gram 17', price: 39990000 },
      { name: 'Razer Blade 15', price: 54990000 },
    ],
  },
  {
    name: 'Âm thanh',
    slug: 'am-thanh',
    keyword: 'headphones',
    products: [
      { name: 'AirPods Pro 2 USB-C', price: 5990000 },
      { name: 'Sony WH-1000XM5', price: 7990000 },
      { name: 'Bose QuietComfort Ultra', price: 8990000 },
      { name: 'Sennheiser Momentum 4', price: 8490000 },
      { name: 'JBL Tour One M2', price: 6490000 },
      { name: 'Marshall Major V', price: 3490000 },
      { name: 'Beats Studio Pro', price: 7290000 },
      { name: 'Samsung Galaxy Buds3 Pro', price: 4990000 },
      { name: 'Soundcore Liberty 4 NC', price: 1990000 },
      { name: 'Audio-Technica ATH-M50x', price: 3290000 },
    ],
  },
  {
    name: 'Phụ kiện',
    slug: 'phu-kien',
    keyword: 'gadget',
    products: [
      { name: 'Củ sạc Anker 65W GaN', price: 990000 },
      { name: 'Cáp USB-C Belkin 2m', price: 390000 },
      { name: 'Sạc dự phòng Xiaomi 20000mAh', price: 690000 },
      { name: 'Hub USB-C Ugreen 6-in-1', price: 890000 },
      { name: 'Bàn phím cơ Keychron K8 Pro', price: 2490000 },
      { name: 'Chuột Logitech MX Master 3S', price: 2390000 },
      { name: 'Giá đỡ laptop Rain Design mStand', price: 1290000 },
      { name: 'Túi chống sốc Tomtoc 14"', price: 690000 },
      { name: 'Ốp lưng Spigen Tough Armor', price: 350000 },
      { name: 'Kính cường lực Nillkin', price: 250000 },
    ],
  },
  {
    name: 'Thiết bị đeo',
    slug: 'thiet-bi-deo',
    keyword: 'smartwatch',
    products: [
      { name: 'Apple Watch Series 9 GPS', price: 9990000 },
      { name: 'Apple Watch Ultra 2', price: 21990000 },
      { name: 'Samsung Galaxy Watch6 Classic', price: 8490000 },
      { name: 'Garmin Fenix 7 Pro', price: 19990000 },
      { name: 'Huawei Watch GT4 46mm', price: 5990000 },
      { name: 'Xiaomi Smart Band 8 Pro', price: 990000 },
      { name: 'Amazfit GTR 4', price: 4490000 },
      { name: 'Fitbit Charge 6', price: 2990000 },
      { name: 'Google Pixel Watch 2', price: 8990000 },
      { name: 'Fossil Gen 6 Smartwatch', price: 5490000 },
    ],
  },
];

// ---- Helpers --------------------------------------------------------------
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensurePublicBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: PUBLIC_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: PUBLIC_BUCKET }));
    console.log(`✅ Created bucket ${PUBLIC_BUCKET}`);
  }
  // Policy public-read idempotent — khớp MinioService.ensureBucketExists
  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: PUBLIC_BUCKET,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${PUBLIC_BUCKET}/*`],
          },
        ],
      }),
    }),
  );
  console.log(`✅ Bucket ${PUBLIC_BUCKET} public-read policy ensured`);
}

let lockSeed = 1000; // đảm bảo ảnh loremflickr khác nhau giữa các sản phẩm

async function fetchImageBuffer(keyword: string): Promise<Buffer> {
  const lock = lockSeed++;
  const sources = [
    `https://loremflickr.com/800/800/${encodeURIComponent(keyword)}?lock=${lock}`,
    `https://picsum.photos/seed/${keyword}-${lock}/800/800`,
  ];
  for (const url of sources) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > 1000) return buf;
      } catch {
        /* thử nguồn/lần kế tiếp */
      }
    }
  }
  throw new Error(`Không tải được ảnh cho "${keyword}"`);
}

async function uploadProductImage(
  shopId: string,
  productId: string,
  index: number,
  body: Buffer,
): Promise<string> {
  const key = `${shopId}/${productId}-${index}.jpg`;
  await s3.send(
    new PutObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'image/jpeg',
    }),
  );
  return `${CDN_BASE_URL}/${PUBLIC_BUCKET}/${key}`;
}

// ---- Main -----------------------------------------------------------------
async function main() {
  const shop = await prisma.shop.findUnique({ where: { id: SHOP_ID } });
  if (!shop) throw new Error(`Shop ${SHOP_ID} không tồn tại`);
  console.log(`🏪 Shop: ${shop.name} (${SHOP_ID})`);

  await ensurePublicBucket();

  if (KEEP_EXISTING) {
    console.log('🧹 --keep: giữ nguyên catalog hiện có, chỉ bổ sung sản phẩm mới');
  } else {
    // Xoá dữ liệu catalog cũ của shop (idempotent re-run). Cascade gỡ variants/stock.
    const delP = await prisma.product.deleteMany({ where: { shopId: SHOP_ID } });
    const delC = await prisma.category.deleteMany({ where: { shopId: SHOP_ID } });
    console.log(`🧹 Cleared ${delP.count} products, ${delC.count} categories`);
  }

  // Stock location mặc định
  let location = await prisma.stockLocation.findFirst({
    where: { shopId: SHOP_ID, isDefault: true },
  });
  if (!location) {
    location = await prisma.stockLocation.findFirst({ where: { shopId: SHOP_ID } });
  }
  if (!location) {
    location = await prisma.stockLocation.create({
      data: { shopId: SHOP_ID, name: 'Kho mặc định', isDefault: true },
    });
    console.log(`📦 Created default stock location`);
  }

  let totalProducts = 0;
  let totalImages = 0;
  let skuCounter = 0;

  for (let ci = 0; ci < CATEGORIES.length; ci++) {
    const c = CATEGORIES[ci];
    const category = await prisma.category.create({
      data: {
        shopId: SHOP_ID,
        name: c.name,
        slug: c.slug,
        position: ci,
        isActive: true,
      },
    });
    console.log(`\n📁 Category: ${c.name}`);

    for (const p of c.products) {
      const slug = slugify(p.name);
      // 1. Tạo product + master variant
      const product = await prisma.product.create({
        data: {
          shopId: SHOP_ID,
          name: p.name,
          slug,
          description: `${p.name} — hàng chính hãng, bảo hành 12 tháng.`,
          status: 'PUBLISHED',
          categoryId: category.id,
          variants: {
            create: [
              {
                shopId: SHOP_ID,
                sku: `${c.slug.toUpperCase().replace(/-/g, '')}-${String(++skuCounter).padStart(3, '0')}`,
                price: p.price,
                currency: 'VND',
                isMaster: true,
              },
            ],
          },
        },
        include: { variants: true },
      });

      // 2. Tồn kho
      await prisma.stockItem.create({
        data: {
          stockLocationId: location.id,
          variantId: product.variants[0].id,
          countOnHand: Math.floor(Math.random() * 80) + 20,
        },
      });

      // 3. Ảnh → MinIO
      const urls: string[] = [];
      for (let n = 1; n <= IMAGES_PER_PRODUCT; n++) {
        try {
          const buf = await fetchImageBuffer(c.keyword);
          const url = await uploadProductImage(SHOP_ID, product.id, n, buf);
          urls.push(url);
          totalImages++;
        } catch (e: any) {
          console.warn(`   ⚠️  ảnh ${n} của "${p.name}" lỗi: ${e.message}`);
        }
      }

      // 4. Gắn ảnh vào product
      if (urls.length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: urls, imageUrl: urls[0] },
        });
      }

      totalProducts++;
      console.log(`   ✓ ${p.name}  [${urls.length} ảnh]`);
    }
  }

  console.log(
    `\n🎉 Done: ${totalProducts} sản phẩm / ${CATEGORIES.length} categories / ${totalImages} ảnh đã upload.`,
  );
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
