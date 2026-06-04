import { PrismaClient } from '@prisma/client';

export async function seedTestShop() {
  const prisma = new PrismaClient();
  
  // Clean up previous runs if any
  await prisma.shop.deleteMany({ where: { domain: 'test-shop-e2e.localhost' } });
  
  // Tạo owner user + gán quyền
  const user = await prisma.user.create({
    data: {
      email: `test-owner-${Date.now()}@shopvolo.test`,
      name: 'Test Owner',
      role: 'OWNER',
    }
  });

  const shop = await prisma.shop.create({
    data: {
      ownerId: user.id,
      name: 'Test Shop E2E',
      domain: 'test-shop-e2e.localhost',
    }
  });
  

  
  // Tạo Session token (bypass auth cho E2E)
  const session = await prisma.session.create({
    data: {
      id: `test-session-id-${Date.now()}`,
      userId: user.id,
      token: `test-session-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  
  await prisma.$disconnect();
  return { shopId: shop.id, userId: user.id, token: session.token };
}
