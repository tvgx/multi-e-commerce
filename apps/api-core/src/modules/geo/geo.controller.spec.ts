import { Test, TestingModule } from '@nestjs/testing';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';

describe('GeoController', () => {
  let controller: GeoController;
  let service: { listProvinces: jest.Mock; listWards: jest.Mock };

  beforeEach(async () => {
    service = {
      listProvinces: jest.fn(),
      listWards: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeoController],
      providers: [{ provide: GeoService, useValue: service }],
    }).compile();

    controller = module.get(GeoController);
  });

  it('provinces() wraps the service result in a success response', async () => {
    const rows = [{ code: '79', name: 'Thành phố Hồ Chí Minh' }];
    service.listProvinces.mockResolvedValue(rows);

    const res = await controller.provinces();

    expect(service.listProvinces).toHaveBeenCalledTimes(1);
    expect(res.success).toBe(true);
    expect(res.data).toEqual(rows);
  });

  it('wards() forwards the province code and wraps the result', async () => {
    const rows = [{ code: '0001', name: 'Phường 1', provinceCode: '79' }];
    service.listWards.mockResolvedValue(rows);

    const res = await controller.wards('79');

    expect(service.listWards).toHaveBeenCalledWith('79');
    expect(res.success).toBe(true);
    expect(res.data).toEqual(rows);
  });
});
