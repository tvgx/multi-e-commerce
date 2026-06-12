import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { LayoutService } from './layout.service';
import { TenantService } from '../../common/services/tenant.service';

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
  let globalModel: ReturnType<typeof makeModel>;
  let pageModel: ReturnType<typeof makeModel>;
  let uiModel: ReturnType<typeof makeModel>;

  const SHOP = 'shop-1';

  beforeEach(async () => {
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    globalModel = makeModel();
    pageModel = makeModel();
    uiModel = makeModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LayoutService,
        { provide: TenantService, useValue: tenant },
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

      // One starter page per editable page type
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
