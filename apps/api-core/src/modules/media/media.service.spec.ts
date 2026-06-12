import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { MinioService } from '../../common/services/minio.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';
import { createMockMinio } from '../../../test/helpers/mocks';

// These are ESM-only / native deps the service imports at module load; replace
// them so ts-jest never has to transform them and the spec stays deterministic.
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }));
jest.mock('sharp', () => jest.fn());
jest.mock('blurhash', () => ({ encode: jest.fn() }));
// minio.service pulls in `uuid` + `@aws-sdk/client-s3` (ESM .js, untransformed).
// Stub the module so only the DI token class is loaded.
jest.mock('../../common/services/minio.service', () => ({
  MinioService: class MinioService {},
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fileTypeFromBuffer } = require('file-type');

describe('MediaService', () => {
  let service: MediaService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };
  let minio: ReturnType<typeof createMockMinio>;

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    minio = createMockMinio();
    (fileTypeFromBuffer as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
        { provide: MinioService, useValue: minio },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  const pdf = () => ({
    buffer: Buffer.from('pdf'),
    size: 2048,
    originalname: 'doc.pdf',
  });

  describe('uploadFile', () => {
    it('rejects a file larger than 10MB', async () => {
      await expect(
        service.uploadFile({ ...pdf(), size: 11 * 1024 * 1024 }, {} as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a file whose type cannot be determined', async () => {
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue(undefined);
      await expect(service.uploadFile(pdf(), {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('uploads a non-image, stores the record and increments storage usage', async () => {
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'application/pdf' });
      minio.uploadFile.mockResolvedValue('https://cdn.test/test-bucket/doc-123.pdf');
      prisma.media.create.mockResolvedValue({ id: 'm1' });

      const res = await service.uploadFile(pdf(), {} as any);

      expect(minio.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'doc.pdf',
        'application/pdf',
      );
      expect(prisma.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shopId: SHOP,
          url: 'https://cdn.test/test-bucket/doc-123.pdf',
          key: 'doc-123.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          blurHash: null,
        }),
      });
      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { id: SHOP },
        data: { storageUsedBytes: { increment: 2048 } },
      });
      expect(res).toEqual({ id: 'm1' });
    });
  });

  describe('deleteMedia', () => {
    it('throws NotFound when the media is not in this shop', async () => {
      prisma.media.findFirst.mockResolvedValue(null);
      await expect(service.deleteMedia('m1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deletes the record, refunds quota, then removes the object', async () => {
      prisma.media.findFirst.mockResolvedValue({
        id: 'm1',
        key: 'doc-123.pdf',
        bucket: 'test-bucket',
        size: 2048,
      });

      const res = await service.deleteMedia('m1');

      expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
      expect(minio.deleteFile).toHaveBeenCalledWith('doc-123.pdf', 'test-bucket');
      expect(res).toEqual({ status: 'deleted', id: 'm1' });
    });

    it('still succeeds when MinIO removal fails (no dangling record)', async () => {
      prisma.media.findFirst.mockResolvedValue({
        id: 'm1',
        key: 'k',
        bucket: 'b',
        size: 10,
      });
      minio.deleteFile.mockRejectedValue(new Error('minio down'));

      const res = await service.deleteMedia('m1');
      expect(res.status).toBe('deleted');
    });
  });
});
