import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { SystemCacheService } from './cache.service';

describe('SystemCacheService', () => {
  let service: SystemCacheService;
  let cacheManager: any;
  let configService: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<SystemCacheService>(SystemCacheService);

    // Mock global fetch for revalidateStorefront tests
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call cacheManager.get loop', async () => {
    cacheManager.get.mockResolvedValue('testValue');
    const result = await service.get('testKey');
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
      configService.get.mockReturnValueOnce(null); // missing URL
      configService.get.mockReturnValueOnce('secret');
      
      const result = await service.revalidateStorefront('test-tag');
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false if fetch request fails', async () => {
      configService.get.mockReturnValueOnce('http://localhost:3000');
      configService.get.mockReturnValueOnce('dev_secret');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await service.revalidateStorefront('test-tag');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/revalidate?tag=test-tag&secret=dev_secret',
        { method: 'POST' }
      );
      expect(result).toBe(false);
    });

    it('should return true if fetch request is successful', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'STOREFRONT_URL') return 'http://localhost:3000';
        if (key === 'REVALIDATE_SECRET') return 'dev_secret';
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await service.revalidateStorefront('test-tag');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/revalidate?tag=test-tag&secret=dev_secret',
        { method: 'POST' }
      );
      expect(result).toBe(true);
    });
    
    it('should return false if fetch throws an error', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'STOREFRONT_URL') return 'http://localhost:3000';
        if (key === 'REVALIDATE_SECRET') return 'dev_secret';
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.revalidateStorefront('test-tag');
      
      expect(result).toBe(false);
    });
  });
});
