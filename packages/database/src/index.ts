// packages/database/src/index.ts
export * from '@prisma/client';
export { ShopTemplate, MongoProduct } from './mongodb/models';
export type { IShopTemplate, IProduct as IMongoProduct } from './mongodb/models';
