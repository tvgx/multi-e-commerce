import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Seed các gói dịch vụ nền tảng (Billing & Plans): Free / Pro / Business.
 * Upsert theo `key` nên chạy lại an toàn. Chạy: npm run seed:plans
 */

const prisma = new PrismaClient();

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    description: 'Dùng thử nền tảng với một cửa hàng nhỏ.',
    priceMonthly: 0,
    maxShops: 1,
    maxProductsPerShop: 30,
    sortOrder: 0,
    features: {
      analytics: 'basic',
      support: 'community',
      customDomain: false,
      themeMarket: false,
    },
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'Cho người bán đang tăng trưởng: nhiều shop, phân tích đầy đủ.',
    priceMonthly: 199_000,
    maxShops: 5,
    maxProductsPerShop: 500,
    sortOrder: 1,
    features: {
      analytics: 'full',
      support: 'email',
      customDomain: true,
      themeMarket: true,
    },
  },
  {
    key: 'business',
    name: 'Business',
    description: 'Quy mô lớn: giới hạn cao, hỗ trợ ưu tiên.',
    priceMonthly: 499_000,
    maxShops: 50,
    maxProductsPerShop: 5000,
    sortOrder: 2,
    features: {
      analytics: 'full',
      support: 'priority',
      customDomain: true,
      themeMarket: true,
    },
  },
];

async function main() {
  console.log('--- SEED PLANS (Billing & Plans) ---');
  for (const plan of PLANS) {
    const { key, features, ...rest } = plan;
    await prisma.plan.upsert({
      where: { key },
      create: { key, ...rest, features },
      update: { ...rest, features },
    });
    console.log(`✓ ${plan.name} (${key}) — ${plan.priceMonthly.toLocaleString('vi-VN')}đ/tháng`);
  }
  const count = await prisma.plan.count();
  console.log(`✅ Hoàn tất: ${count} gói trong bảng plans.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
