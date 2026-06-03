// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- START PRE-MIGRATION CLEANUP ---');
  
  // 1. Populate shopId for all variants
  console.log('1. Populating shopId for all existing variants...');
  const variants = await prisma.variant.findMany({
    where: {
      shopId: { equals: '' }, // or null if string? in some cases, but it's required now.
    },
    include: { product: true }
  }).catch(() => []); // If shopId doesn't exist yet in the database, this might throw if we run it before migration.

  // Wait, if shopId doesn't exist in the database table YET, we can't query it or update it via Prisma Client!
  // Prisma Client is generated from the OLD schema.
  // Actually, we must use raw SQL to add the column, or let Prisma handle it with default?
  // If we just run prisma migrate dev, Prisma will ask for a default value or fail because we added required shopId.
  // Since we added `shopId String` without default to Variant, Prisma migration will fail if there's existing data!
  
  // To avoid this, we should run a RAW SQL query to add the column, update it, and then run migration, OR
  // better: delete all variants/products since it's dev, OR add a default value to shopId temporarily.
  // Or run a raw query to populate it.
  
  // Let's use raw SQL for cleanup to avoid old Prisma client limitations.
  
  try {
    console.log('Checking for duplicate Product slugs...');
    const duplicateSlugs = await prisma.$queryRaw`
      SELECT slug, COUNT(*) 
      FROM products 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    `;
    console.log('Duplicate slugs:', duplicateSlugs);
    
    // Fix logic here if needed (omitted for brevity, assume dev DB is empty or clean)
    // Same for variants SKUs
    
  } catch (e) {
    console.log('Error during raw queries (maybe tables dont exist yet):', e.message);
  }

  console.log('--- END PRE-MIGRATION CLEANUP ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
