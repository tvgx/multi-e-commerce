
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shops = await prisma.shop.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      domain: true,
      status: true,
    }
  });
  console.log('Shops in Postgres:', JSON.stringify(shops, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
