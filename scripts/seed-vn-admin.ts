import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Seed đơn vị hành chính VN (2 cấp: Tỉnh/Thành → Phường/Xã, sau sáp nhập 2025).
 * Dữ liệu: packages/database/data/vn-admin-2cap.json (nguồn provinces.open-api.vn v2).
 * Chạy: npm run seed:geo
 */

const DATA_PATH = path.join(__dirname, '..', 'packages', 'database', 'data', 'vn-admin-2cap.json');

type Province = { code: string; name: string };
type Ward = { code: string; name: string; provinceCode: string };

const prisma = new PrismaClient();

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log('--- SEED ĐƠN VỊ HÀNH CHÍNH VN (2 cấp) ---');
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`Không tìm thấy dataset: ${DATA_PATH}`);
  }
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as {
    provinces: Province[];
    wards: Ward[];
  };

  console.log(`[provinces] đang seed ${raw.provinces.length} tỉnh/thành...`);
  await prisma.province.createMany({
    data: raw.provinces.map((p) => ({ code: p.code, name: p.name })),
    skipDuplicates: true,
  });

  console.log(`[wards] đang seed ${raw.wards.length} phường/xã...`);
  for (const batch of chunk(raw.wards, 500)) {
    await prisma.ward.createMany({
      data: batch.map((w) => ({ code: w.code, name: w.name, provinceCode: w.provinceCode })),
      skipDuplicates: true,
    });
  }

  const [pCount, wCount] = await Promise.all([prisma.province.count(), prisma.ward.count()]);
  console.log(`✅ Hoàn tất: ${pCount} tỉnh/thành, ${wCount} phường/xã.`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed geo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
