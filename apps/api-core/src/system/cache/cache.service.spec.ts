import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SystemCacheService } from './cache.service';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

describe('SystemCacheService', () => {
  let service: SystemCacheService;
  let cacheManager: any;
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const oldStorefrontUrl = process.env.STOREFRONT_URL;
  const oldRevalidateSecret = process.env.REVALIDATE_SECRET;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<SystemCacheService>(SystemCacheService);

    // Mock global fetch for revalidateStorefront tests
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (oldStorefrontUrl === undefined) {
      delete process.env.STOREFRONT_URL;
    } else {
      process.env.STOREFRONT_URL = oldStorefrontUrl;
    }

    if (oldRevalidateSecret === undefined) {
      delete process.env.REVALIDATE_SECRET;
    } else {
      process.env.REVALIDATE_SECRET = oldRevalidateSecret;
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call cacheManager.get', async () => {
    cacheManager.get.mockResolvedValueOnce('testValue');
    const result = await service.get<string>('testKey');
    expect(cacheManager.get).toHaveBeenCalledWith('testKey');
    expect(result).toBe('testValue');
  });

  it('should call cacheManager.set', async () => {
    await service.set('testKey', 'testValue', 3000);
    expect(cacheManager.set).toHaveBeenCalledWith('testKey', 'testValue', 3000);
  });

  it('should call cacheManager.del', async () => {
    await service.del('testKey');
    expect(cacheManager.del).toHaveBeenCalledWith('testKey');
  });

  describe('revalidateStorefront', () => {
    it('should return false if STOREFRONT_URL or REVALIDATE_SECRET is missing', async () => {
      delete process.env.STOREFRONT_URL;
      process.env.REVALIDATE_SECRET = 'secret';

      const result = await service.revalidateStorefront('test-tag');
      expect(result).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should return false if fetch request fails', async () => {
      process.env.STOREFRONT_URL = 'http://localhost:5201';
      process.env.REVALIDATE_SECRET = 'dev_secret';

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await service.revalidateStorefront('test-tag');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5201/api/revalidate?tag=test-tag&secret=dev_secret',
        { method: 'POST' },
      );
      expect(result).toBe(false);
    });

    it('should return true if fetch request is successful', async () => {
      process.env.STOREFRONT_URL = 'http://localhost:5201';
      process.env.REVALIDATE_SECRET = 'dev_secret';

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const result = await service.revalidateStorefront('test-tag');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5201/api/revalidate?tag=test-tag&secret=dev_secret',
        { method: 'POST' },
      );
      expect(result).toBe(true);
    });

    it('should return false if fetch throws an error', async () => {
      process.env.STOREFRONT_URL = 'http://localhost:5201';
      process.env.REVALIDATE_SECRET = 'dev_secret';

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.revalidateStorefront('test-tag');

      expect(result).toBe(false);
    });
  });
});
