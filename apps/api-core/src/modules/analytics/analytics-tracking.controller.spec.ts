import { AnalyticsTrackingController } from './analytics-tracking.controller';

describe('AnalyticsTrackingController', () => {
  it('forwards the beacon body to the service', async () => {
    const service = { trackVisit: jest.fn().mockResolvedValue({ recorded: true }) };
    const controller = new AnalyticsTrackingController(service as any);

    const dto = { shopId: 's1', visitorId: 'v1', path: '/home' };
    await expect(controller.trackVisit(dto)).resolves.toEqual({ recorded: true });
    expect(service.trackVisit).toHaveBeenCalledWith(dto);
  });
});
