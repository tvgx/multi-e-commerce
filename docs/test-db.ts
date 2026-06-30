import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function seedUser() {
  await prisma.user.upsert({
    where: { id: 'dev-user-123' },
    update: {},
    create: {
      id: 'dev-user-123',
      email: 'admin@omnicommerce.local',
      name: 'Omni Admin',
      role: 'ADMIN',
    }
  });
  console.log('dev-user-123 seeded');
  process.exit(0);
}
seedUser();
