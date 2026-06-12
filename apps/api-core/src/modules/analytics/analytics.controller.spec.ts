import { AnalyticsController } from './analytics.controller';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: Record<string, jest.Mock>;

  beforeEach(() => {
    service = {
      getDashboard: jest.fn().mockResolvedValue({}),
      getSummary: jest.fn().mockResolvedValue({}),
      getRevenueSeries: jest.fn().mockResolvedValue([]),
      getOrdersByStatus: jest.fn().mockResolvedValue({}),
      getTopProducts: jest.fn().mockResolvedValue([]),
      getCustomerInsights: jest.fn().mockResolvedValue({}),
      getPlatformDashboard: jest.fn().mockResolvedValue({}),
      getPlatformSummary: jest.fn().mockResolvedValue({}),
      getPlatformRevenueSeries: jest.fn().mockResolvedValue([]),
      getTopShops: jest.fn().mockResolvedValue([]),
    };
    controller = new AnalyticsController(service as any);
  });

  describe('shop endpoints', () => {
    it('forward the period to the service', () => {
      controller.getDashboard('7d');
      controller.getSummary('30d');
      controller.getTopProducts('30d', '5');
      expect(service.getDashboard).toHaveBeenCalledWith('7d');
      expect(service.getSummary).toHaveBeenCalledWith('30d');
      expect(service.getTopProducts).toHaveBeenCalledWith('30d', '5');
    });
  });

  describe('platform scope resolution', () => {
    it('gives ADMIN the whole platform (undefined scope)', () => {
      controller.getPlatformSummary({ user: { role: 'ADMIN' }, shopIds: ['s1'] }, '30d');
      expect(service.getPlatformSummary).toHaveBeenCalledWith(undefined, '30d');
    });

    it('limits an OWNER to their own shopIds', () => {
      controller.getPlatformDashboard({ user: { role: 'OWNER' }, shopIds: ['s1', 's2'] });
      expect(service.getPlatformDashboard).toHaveBeenCalledWith(['s1', 's2'], undefined);
    });

    it('defaults an OWNER with no shopIds to an empty scope', () => {
      controller.getTopShops({ user: { role: 'OWNER' } }, '30d', '10');
      expect(service.getTopShops).toHaveBeenCalledWith([], '30d', '10');
    });
  });
});
