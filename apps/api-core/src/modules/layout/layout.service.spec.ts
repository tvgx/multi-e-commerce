import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { LayoutService } from './layout.service';
import { TenantService } from '../../common/services/tenant.service';
import { MinioService } from '../../common/services/minio.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

// ESM-only / native deps the service loads at import time — stub so ts-jest
// never transforms them. minio.service transitively pulls in @aws-sdk (ESM).
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }));
jest.mock('../../common/services/minio.service', () => ({
  MinioService: class MinioService {},
  LAYOUT_BUCKET: 'shop-layouts',
  PUBLIC_BUCKET: 'shop-public',
}));
// MasterTemplateCatalog is a raw Mongoose model from the shared package
// (createMasterTemplate writes to it) — stub it so the spec needs no live Mongo.
jest.mock('@ecommerce/database', () => ({
  MasterTemplateCatalog: { create: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fileTypeFromBuffer } = require('file-type');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MasterTemplateCatalog } = require('@ecommerce/database');

/** A chainable Mongoose query stub: `.findOne(...).lean().exec()` etc. */
function query(result: unknown) {
  const q: any = {};
  q.lean = jest.fn().mockReturnValue(q);
  q.exec = jest.fn().mockResolvedValue(result);
  return q;
}

function makeModel() {
  return {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    bulkWrite: jest.fn().mockResolvedValue({}),
  };
}

describe('LayoutService', () => {
  let service: LayoutService;
  let tenant: { getTenantId: jest.Mock };
  let prisma: MockPrisma;
  let minio: { listKeys: jest.Mock; uploadFile: jest.Mock; buildPublicUrl: jest.Mock };
  let globalModel: ReturnType<typeof makeModel>;
  let pageModel: ReturnType<typeof makeModel>;
  let uiModel: ReturnType<typeof makeModel>;

  const SHOP = 'shop-1';

  beforeEach(async () => {
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    prisma = createMockPrisma();
    prisma.shop.findUnique.mockResolvedValue({ onboardingStep: 1, onboardingStatus: {} });
    minio = {
      listKeys: jest.fn().mockResolvedValue([]),
      uploadFile: jest.fn(),
      buildPublicUrl: jest.fn(),
    };
    (fileTypeFromBuffer as jest.Mock).mockReset();
    globalModel = makeModel();
    pageModel = makeModel();
    uiModel = makeModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LayoutService,
        { provide: TenantService, useValue: tenant },
        { provide: MinioService, useValue: minio },
        { provide: PrismaService, useValue: prisma },
        { provide: getModelToken('GlobalLayout'), useValue: globalModel },
        { provide: getModelToken('PageLayout'), useValue: pageModel },
        { provide: getModelToken('UIComponentCatalog'), useValue: uiModel },
      ],
    }).compile();

    service = module.get(LayoutService);
  });

  describe('getTenantLayout', () => {
    it('throws BadRequest with no tenant context', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(service.getTenantLayout()).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('auto-initializes a layout when none exists', async () => {
      globalModel.findOne.mockReturnValue(query(null));
      globalModel.create.mockResolvedValue({ shopId: SHOP, publishedData: {} });
      const res = await service.getTenantLayout();
      expect(globalModel.create).toHaveBeenCalledWith({
        shopId: SHOP,
        publishedData: {},
        draftData: {},
      });
      expect(res.data).toEqual({ shopId: SHOP, publishedData: {} });
    });

    it('returns the existing layout', async () => {
      globalModel.findOne.mockReturnValue(query({ shopId: SHOP, draftData: { a: 1 } }));
      const res = await service.getTenantLayout();
      expect(globalModel.create).not.toHaveBeenCalled();
      expect(res.data).toMatchObject({ shopId: SHOP });
    });
  });

  describe('updateTenantLayout', () => {
    it('upserts the draft overrides', async () => {
      globalModel.findOneAndUpdate.mockReturnValue(query({ draftData: { a: 1 } }));
      const res = await service.updateTenantLayout({ overrides: { a: 1 } } as any);
      expect(globalModel.findOneAndUpdate).toHaveBeenCalledWith(
        { shopId: SHOP },
        { $set: { draftData: { a: 1 } } },
        { upsert: true, new: true },
      );
      expect(res.status).toBe('updated');
    });
  });

  describe('publishLayout', () => {
    it('throws when there is no draft', async () => {
      globalModel.findOne.mockReturnValue(query(null));
      await expect(service.publishLayout()).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('copies draftData into publishedData', async () => {
      globalModel.findOne.mockReturnValue(query({ draftData: { hero: true } }));
      globalModel.findOneAndUpdate.mockReturnValue(query({ publishedData: { hero: true } }));
      const res = await service.publishLayout();
      expect(globalModel.findOneAndUpdate).toHaveBeenCalledWith(
        { shopId: SHOP },
        { $set: { publishedData: { hero: true } } },
        { new: true },
      );
      expect(res.status).toBe('published');
    });
  });

  describe('getGlobalLayout (storefront)', () => {
    it('creates an empty layout on first access', async () => {
      globalModel.findOne.mockReturnValue(query(null));
      globalModel.create.mockResolvedValue({ publishedData: {} });
      const res = await service.getGlobalLayout(SHOP);
      expect(res).toEqual({});
    });

    it('returns publishedData when present', async () => {
      globalModel.findOne.mockReturnValue(query({ publishedData: { x: 1 } }));
      const res = await service.getGlobalLayout(SHOP);
      expect(res).toEqual({ x: 1 });
    });
  });

  describe('getBuilderGlobal', () => {
    it('prefers non-empty draftData over publishedData', async () => {
      globalModel.findOne.mockReturnValue(
        query({ draftData: { d: 1 }, publishedData: { p: 1 } }),
      );
      const res = await service.getBuilderGlobal(SHOP);
      expect(res).toEqual({ d: 1 });
    });

    it('falls back to publishedData when draft is empty', async () => {
      globalModel.findOne.mockReturnValue(
        query({ draftData: {}, publishedData: { p: 1 } }),
      );
      const res = await service.getBuilderGlobal(SHOP);
      expect(res).toEqual({ p: 1 });
    });
  });

  describe('getPageLayout', () => {
    it('returns null when there is no page layout', async () => {
      pageModel.findOne.mockReturnValue(query(null));
      const res = await service.getPageLayout(SHOP, 'home');
      expect(res).toBeNull();
    });

    it('returns publishedData and filters by slug when given', async () => {
      pageModel.findOne.mockReturnValue(query({ publishedData: { hero: 1 } }));
      const res = await service.getPageLayout(SHOP, 'product', 'my-slug');
      expect(pageModel.findOne).toHaveBeenCalledWith(
        { shopId: SHOP, pageType: 'product', slug: 'my-slug' },
        { publishedData: 1 },
      );
      expect(res).toEqual({ hero: 1 });
    });
  });

  describe('publishLayoutByShopId', () => {
    it('publishes the global draft and bulk-publishes page drafts', async () => {
      globalModel.findOne.mockReturnValue(query({ draftData: { g: 1 } }));
      globalModel.findOneAndUpdate.mockReturnValue(query({}));
      pageModel.find.mockReturnValue(
        query([
          { pageType: 'home', draftData: { h: 1 } },
          { pageType: 'about', draftData: {} }, // skipped (empty)
        ]),
      );

      const res = await service.publishLayoutByShopId(SHOP);

      expect(globalModel.findOneAndUpdate).toHaveBeenCalled();
      expect(pageModel.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { shopId: SHOP, pageType: 'home' },
            update: { $set: { publishedData: { h: 1 } } },
          },
        },
      ]);
      expect(res).toEqual({ status: 'published', shopId: SHOP });
    });

    it('takes the shop out of DRAFT and marks the design step complete', async () => {
      globalModel.findOne.mockReturnValue(query({ draftData: {} }));
      pageModel.find.mockReturnValue(query([]));
      prisma.shop.findUnique.mockResolvedValue({ onboardingStep: 1, onboardingStatus: { step1: 'COMPLETED' } });

      await service.publishLayoutByShopId(SHOP);

      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { id: SHOP },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          onboardingStep: 4,
          onboardingStatus: expect.objectContaining({ step1: 'COMPLETED', step4: 'COMPLETED' }),
        }),
      });
    });
  });

  describe('publish-time image materialization', () => {
    const draftWithBg = (url: string) => ({
      components: [
        { id: 's1', componentId: 'Hero', props: { backgroundImageUrl: url, title: 'Hi' } },
      ],
    });

    const realFetch = global.fetch;
    afterEach(() => {
      global.fetch = realFetch;
    });

    it('rewrites a non-shop-layouts background image into shop-layouts/<shopId>/ on publish', async () => {
      const draft = draftWithBg('http://localhost:9000/assets/default-component.png');
      globalModel.findOne.mockReturnValue(query({ draftData: {} }));
      pageModel.find.mockReturnValue(query([{ pageType: 'home', draftData: draft }]));
      // Not materialized before → download bytes then upload a fresh copy.
      minio.listKeys.mockResolvedValue([]);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      }) as any;
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'image/png', ext: 'png' });
      minio.uploadFile.mockResolvedValue(
        'http://localhost:9000/shop-layouts/shop-1/pub-abc.png',
      );

      await service.publishLayoutByShopId(SHOP);

      // Uploaded into the layout bucket under the shop prefix.
      const [, key, , bucket] = minio.uploadFile.mock.calls[0];
      expect(key.startsWith(`${SHOP}/pub-`)).toBe(true);
      expect(bucket).toBe('shop-layouts');

      // Published JSON references the new URL; draft fixture untouched.
      const published =
        pageModel.bulkWrite.mock.calls[0][0][0].updateOne.update.$set.publishedData;
      expect(published.components[0].props.backgroundImageUrl).toBe(
        'http://localhost:9000/shop-layouts/shop-1/pub-abc.png',
      );
      expect(draft.components[0].props.backgroundImageUrl).toBe(
        'http://localhost:9000/assets/default-component.png',
      );
    });

    it('reuses an already-materialized object instead of re-uploading (idempotent)', async () => {
      const draft = draftWithBg('http://localhost:9000/assets/default-component.png');
      globalModel.findOne.mockReturnValue(query({ draftData: {} }));
      pageModel.find.mockReturnValue(query([{ pageType: 'home', draftData: draft }]));
      minio.listKeys.mockResolvedValue(['shop-1/pub-abc.png']);
      minio.buildPublicUrl.mockReturnValue(
        'http://localhost:9000/shop-layouts/shop-1/pub-abc.png',
      );

      await service.publishLayoutByShopId(SHOP);

      expect(minio.uploadFile).not.toHaveBeenCalled();
      const published =
        pageModel.bulkWrite.mock.calls[0][0][0].updateOne.update.$set.publishedData;
      expect(published.components[0].props.backgroundImageUrl).toBe(
        'http://localhost:9000/shop-layouts/shop-1/pub-abc.png',
      );
    });

    it('leaves images already under shop-layouts/<shopId>/ untouched', async () => {
      const url = 'http://localhost:9000/shop-layouts/shop-1/existing.png';
      const draft = draftWithBg(url);
      globalModel.findOne.mockReturnValue(query({ draftData: {} }));
      pageModel.find.mockReturnValue(query([{ pageType: 'home', draftData: draft }]));

      await service.publishLayoutByShopId(SHOP);

      expect(minio.listKeys).not.toHaveBeenCalled();
      expect(minio.uploadFile).not.toHaveBeenCalled();
      const published =
        pageModel.bulkWrite.mock.calls[0][0][0].updateOne.update.$set.publishedData;
      expect(published.components[0].props.backgroundImageUrl).toBe(url);
    });
  });

  describe('createMasterTemplate (LAY-1)', () => {
    it('rejects a missing schema instead of silently succeeding', async () => {
      await expect(
        service.createMasterTemplate({ industry: 'fashion' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(MasterTemplateCatalog.create).not.toHaveBeenCalled();
    });

    it('persists a custom catalog entry carrying the layout schema', async () => {
      (MasterTemplateCatalog.create as jest.Mock).mockResolvedValue({
        templateKey: 'custom-fashion-abc',
      });
      const res = await service.createMasterTemplate({
        industry: 'Fashion',
        schema: { components: [] },
      } as any);

      const data = (MasterTemplateCatalog.create as jest.Mock).mock.calls[0][0];
      expect(data).toMatchObject({
        templateType: 'custom',
        industry: 'Fashion',
        isCustom: true,
        layoutSchema: { components: [] },
      });
      expect(data.templateKey).toMatch(/^custom-fashion-/);
      expect(res.status).toBe('created');
    });
  });

  describe('getComponentSchemas', () => {
    it('returns the catalog of UI component schemas', async () => {
      uiModel.find.mockReturnValue(query([{ type: 'hero' }]));
      const res = await service.getComponentSchemas();
      expect(res).toEqual([{ type: 'hero' }]);
    });
  });

  describe('saveBuilderPage (per editable page)', () => {
    it.each(['home', 'product_listing', 'product_detail'])(
      'upserts the draft for the %s page',
      async (pageType) => {
        const components = [{ id: 'x', componentId: 'Hero', props: {} }];
        pageModel.findOneAndUpdate.mockReturnValue(query({ draftData: { components } }));
        await service.saveBuilderPage(SHOP, pageType, components);
        expect(pageModel.findOneAndUpdate).toHaveBeenCalledWith(
          { shopId: SHOP, pageType },
          { $set: { draftData: { components } } },
          { upsert: true, new: true },
        );
      },
    );
  });

  describe('seedDefaultLayouts', () => {
    it('throws BadRequest when shopId is missing', async () => {
      await expect(service.seedDefaultLayouts('')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('seeds global + every editable page for a fresh shop', async () => {
      globalModel.findOne.mockReturnValue(query(null));
      globalModel.findOneAndUpdate.mockReturnValue(query({}));
      pageModel.findOne.mockReturnValue(query(null));
      pageModel.findOneAndUpdate.mockReturnValue(query({}));

      const res = await service.seedDefaultLayouts(SHOP, { shopName: 'My Shop' });

      // Global header/footer + theme written to both draft and published
      expect(globalModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      const [filter, update, options] = globalModel.findOneAndUpdate.mock.calls[0];
      expect(filter).toEqual({ shopId: SHOP });
      expect(options).toEqual({ upsert: true, new: true });
      expect(update.$set.draftData.theme.shopName).toBe('My Shop');
      expect(update.$set.draftData.globalComponents.map((c: any) => c.componentId)).toEqual(['Header', 'Footer']);
      expect(update.$set.publishedData).toEqual(update.$set.draftData);

      // One starter page per editable page type — checkout/profile không còn
      // editable (TODO 21): storefront luôn render bản mặc định.
      expect(pageModel.findOneAndUpdate).toHaveBeenCalledTimes(3);
      const seededTypes = pageModel.findOneAndUpdate.mock.calls.map((c) => c[0].pageType);
      expect(seededTypes).toEqual(['home', 'product_listing', 'product_detail']);
      const listingCall = pageModel.findOneAndUpdate.mock.calls.find((c) => c[0].pageType === 'product_listing')!;
      expect(listingCall[1].$set.draftData.components[0].componentId).toBe('StandardCategoryPage');

      expect(res).toEqual({
        status: 'seeded',
        shopId: SHOP,
        seeded: { global: true, pages: ['home', 'product_listing', 'product_detail'] },
      });
    });

    it('does not clobber pages/global that already have content', async () => {
      globalModel.findOne.mockReturnValue(query({ publishedData: { globalComponents: [{}] } }));
      pageModel.findOne.mockReturnValue(query({ draftData: { components: [{}] } }));

      const res = await service.seedDefaultLayouts(SHOP, { shopName: 'My Shop' });

      expect(globalModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(pageModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(res.seeded).toEqual({ global: false, pages: [] });
    });
  });
});
