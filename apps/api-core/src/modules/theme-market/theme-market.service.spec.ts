import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ThemeMarketService } from './theme-market.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

/** Chainable Mongoose query stub: `.findOne(...).lean().exec()` etc. */
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
    updateMany: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  };
}

describe('ThemeMarketService', () => {
  let service: ThemeMarketService;
  let prisma: MockPrisma;
  let themeModel: ReturnType<typeof makeModel>;
  let globalModel: ReturnType<typeof makeModel>;
  let pageModel: ReturnType<typeof makeModel>;

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    themeModel = makeModel();
    globalModel = makeModel();
    pageModel = makeModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeMarketService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: getModelToken('ThemeTemplate'), useValue: themeModel },
        { provide: getModelToken('GlobalLayout'), useValue: globalModel },
        { provide: getModelToken('PageLayout'), useValue: pageModel },
      ],
    }).compile();

    service = module.get(ThemeMarketService);
  });

  describe('getPublishedTheme (THEME-2)', () => {
    it('404s a non-published theme for anonymous callers', async () => {
      themeModel.findOne.mockReturnValue(query(null));
      await expect(service.getPublishedTheme('t1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(themeModel.findOne).toHaveBeenCalledWith({
        themeId: 't1',
        status: 'published',
      });
    });

    it('strips internal identifiers from the public view', async () => {
      themeModel.findOne.mockReturnValue(
        query({
          themeId: 't1',
          title: 'Nice',
          status: 'published',
          ownerUserId: 'u1',
          tenantId: 'ten1',
          ownerShopId: 's1',
          review: { reviewedBy: 'admin' },
        }),
      );
      const res: any = await service.getPublishedTheme('t1');
      expect(res).toMatchObject({ themeId: 't1', title: 'Nice' });
      expect(res.ownerUserId).toBeUndefined();
      expect(res.tenantId).toBeUndefined();
      expect(res.review).toBeUndefined();
    });
  });

  describe('applyTheme (THEME-4)', () => {
    it('applies theme pages and clears stale draft pages not in the theme', async () => {
      themeModel.findOne.mockReturnValue(
        query({
          themeId: 't1',
          global: { theme: {}, globalComponents: [] },
          pages: { home: [{ id: 'c1' }] },
        }),
      );
      prisma.shop.findUnique.mockResolvedValue({ id: SHOP, name: 'My Shop' });
      globalModel.findOneAndUpdate.mockReturnValue(query({}));
      pageModel.findOneAndUpdate.mockReturnValue(query({}));
      // Shop currently has a stale 'about' draft from a previous theme/build.
      pageModel.find.mockReturnValue(
        query([{ pageType: 'home' }, { pageType: 'about' }]),
      );
      pageModel.updateMany.mockReturnValue(query({}));

      const res = await service.applyTheme('t1', SHOP);

      // Theme's own page is upserted into the draft.
      expect(pageModel.findOneAndUpdate).toHaveBeenCalledWith(
        { shopId: SHOP, pageType: 'home' },
        { $set: { draftData: { components: [{ id: 'c1' }] } } },
        { upsert: true, new: true },
      );
      // The stale page's draft is reset (publishedData untouched).
      expect(pageModel.updateMany).toHaveBeenCalledWith(
        { shopId: SHOP, pageType: { $in: ['about'] } },
        { $set: { draftData: {} } },
      );
      expect(res).toMatchObject({
        status: 'applied',
        pages: ['home'],
        clearedPages: ['about'],
      });
    });

    it('clears nothing when the shop has no pages outside the theme', async () => {
      themeModel.findOne.mockReturnValue(
        query({ themeId: 't1', global: {}, pages: { home: [] } }),
      );
      prisma.shop.findUnique.mockResolvedValue({ id: SHOP, name: 'My Shop' });
      globalModel.findOneAndUpdate.mockReturnValue(query({}));
      pageModel.findOneAndUpdate.mockReturnValue(query({}));
      pageModel.find.mockReturnValue(query([{ pageType: 'home' }]));

      const res = await service.applyTheme('t1', SHOP);

      expect(pageModel.updateMany).not.toHaveBeenCalled();
      expect(res.clearedPages).toEqual([]);
    });
  });
});
