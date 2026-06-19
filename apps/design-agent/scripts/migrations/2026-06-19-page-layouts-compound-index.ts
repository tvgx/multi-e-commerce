/**
 * EXTR-1 migration — replace the global unique index on `page_layouts.figma_node_id`
 * with a compound unique index `(figma_node_id, tenant_id)`.
 *
 * WHY: `figma_node_id` is the frame id inside a Figma file, identical across
 * every tenant importing the same file. The old single-field unique index meant
 * a second tenant's import OVERWROTE the first tenant's document (flipping
 * tenant_id) — a silent cross-tenant data leak. The new compound index keeps one
 * document per (frame, tenant); `null` (the shared/global extraction) is its own
 * distinct value.
 *
 * Mongoose `autoIndex` builds the NEW compound index on boot, but it never drops
 * the OLD one — so without this migration both indexes coexist and the old global
 * unique constraint still throws E11000 on the second tenant. Run this ONCE
 * against each environment's Mongo before/at deploy:
 *
 *   cd apps/design-agent
 *   MONGO_DB_ATLAS="<uri>" npx ts-node scripts/migrations/2026-06-19-page-layouts-compound-index.ts
 *
 * Idempotent: re-running is safe (skips the drop if the old index is already gone).
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const OLD_INDEX = 'figma_node_id_1';
const NEW_INDEX = { figma_node_id: 1, tenant_id: 1 } as const;

async function main() {
  const uri =
    process.env.MONGO_DB_ATLAS || 'mongodb://localhost:27017/ecommerce';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const collection = mongoose.connection.collection('page_layouts');

  const indexes = await collection.indexes();
  const hasOld = indexes.some((i) => i.name === OLD_INDEX);

  if (hasOld) {
    console.log(`Dropping legacy global unique index "${OLD_INDEX}"…`);
    await collection.dropIndex(OLD_INDEX);
  } else {
    console.log(`Legacy index "${OLD_INDEX}" not present — nothing to drop.`);
  }

  console.log('Ensuring compound unique index (figma_node_id, tenant_id)…');
  await collection.createIndex(NEW_INDEX, { unique: true });

  console.log('Done. Current indexes:');
  console.table(
    (await collection.indexes()).map((i) => ({
      name: i.name,
      key: JSON.stringify(i.key),
      unique: !!i.unique,
    })),
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
