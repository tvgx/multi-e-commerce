/**
 * Tạo Collections (model mà admin "Categories" + homepage storefront dùng) khớp với
 * các Category đã seed, rồi gắn toàn bộ sản phẩm của từng category vào collection
 * tương ứng qua ProductCollection.
 *
 * Lý do: trang admin /collections (nhãn "Categories") đọc model Collection, không
 * phải Category. Category chỉ phục vụ bộ lọc ở trang all-products của storefront.
 * Script này không đụng tới Category — chỉ bổ sung Collection song song.
 *
 * Chạy:  npx tsx scripts/seed-collections-from-categories.ts [shopId]
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SHOP_ID = process.argv[2] || '2935f8bc-1924-4d52-9fb6-23849aec2927';

async function main() {
  const shop = await prisma.shop.findUnique({ where: { id: SHOP_ID } });
  if (!shop) throw new Error(`Shop ${SHOP_ID} không tồn tại`);
  console.log(`🏪 Shop: ${shop.name} (${SHOP_ID})`);

  const categories = await prisma.category.findMany({
    where: { shopId: SHOP_ID },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
  if (categories.length === 0) {
    throw new Error('Shop chưa có Category nào — chạy seed-electronics-shop trước.');
  }
  console.log(`📁 Tìm thấy ${categories.length} categories`);

  // Idempotent: xoá collection cũ trùng slug để chạy lại được (cascade gỡ ProductCollection)
  const slugs = categories.map((c) => c.slug);
  const delC = await prisma.collection.deleteMany({
    where: { shopId: SHOP_ID, slug: { in: slugs } },
  });
  if (delC.count > 0) console.log(`🧹 Xoá ${delC.count} collection trùng slug`);

  let totalLinks = 0;

  for (const cat of categories) {
    const products = await prisma.product.findMany({
      where: { shopId: SHOP_ID, categoryId: cat.id },
      select: { id: true, imageUrl: true },
    });

    const collection = await prisma.collection.create({
      data: {
        shopId: SHOP_ID,
        title: cat.name,
        slug: cat.slug,
        description: cat.description ?? `Bộ sưu tập ${cat.name}`,
        imageUrl: cat.imageUrl ?? products.find((p) => p.imageUrl)?.imageUrl ?? null,
        isActive: true,
      },
    });

    if (products.length > 0) {
      await prisma.productCollection.createMany({
        data: products.map((p, i) => ({
          productId: p.id,
          collectionId: collection.id,
          order: i,
        })),
        skipDuplicates: true,
      });
      totalLinks += products.length;
    }

    console.log(`   ✓ Collection "${cat.name}"  [${products.length} sản phẩm]`);
  }

  console.log(
    `\n🎉 Done: ${categories.length} collections, ${totalLinks} liên kết sản phẩm.`,
  );
}

main()
  .catch((err) => {
    console.error('❌ Seed collections failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
