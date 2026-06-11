import { PrismaClient } from '@prisma/client';

const url = process.env.SESSION_URL;
const prisma = new PrismaClient({ datasources: { db: { url } } });

const migrations = await prisma.$queryRaw`SELECT migration_name, finished_at IS NOT NULL as ok FROM _prisma_migrations ORDER BY migration_name`;
console.log('=== _prisma_migrations ===');
for (const m of migrations) console.log(`${m.ok ? 'OK ' : 'FAIL'} ${m.migration_name}`);

const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
console.log('\n=== tables ===');
console.log(tables.map(t => t.table_name).join(', '));
await prisma.$disconnect();
