import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

// MasterTemplateCatalog is a Mongoose model from the shared package; stub it so
// the spec doesn't need a live Mongo connection.
jest.mock('@ecommerce/database', () => ({
  MasterTemplateCatalog: { find: jest.fn() },
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MasterTemplateCatalog } = require('@ecommerce/database');

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    (MasterTemplateCatalog.find as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplatesService],
    }).compile();

    service = module.get(TemplatesService);
  });

  it('maps templateKey to id and strips _id', async () => {
    MasterTemplateCatalog.find.mockReturnValue({
      sort: () => ({
        lean: () =>
          Promise.resolve([
            { _id: 'mongo1', templateKey: 'fashion', name: 'Fashion' },
          ]),
      }),
    });

    const res = await service.getMasterTemplates();

    expect(res.code).toBe('1000');
    expect(res.data).toEqual([
      { id: 'fashion', templateKey: 'fashion', name: 'Fashion', _id: undefined },
    ]);
  });

  it('wraps query failures in InternalServerErrorException', async () => {
    MasterTemplateCatalog.find.mockReturnValue({
      sort: () => ({
        lean: () => Promise.reject(new Error('mongo down')),
      }),
    });

    await expect(service.getMasterTemplates()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
