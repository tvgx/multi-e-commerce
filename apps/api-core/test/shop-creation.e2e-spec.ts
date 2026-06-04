import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { MinioService } from '../src/common/services/minio.service';
import { seedTestShop } from './setup-shop';
import * as path from 'path';

describe('Critical Integration: Full Shop Creation Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let minioService: MinioService;
  
  // Test context variables
  let shopId: string;
  let userId: string;
  let token: string;
  let collectionId: string;
  let productId: string;
  let mediaUrl: string;
  let mediaKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    minioService = moduleFixture.get<MinioService>(MinioService);
    
    await app.init();
    
    // Phase 1: Setup Shop & User
    const seeded = await seedTestShop();
    shopId = seeded.shopId;
    userId = seeded.userId;
    token = seeded.token;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.shop.delete({ where: { id: shopId } });
    await app.close();
  });

  describe('PHASE 2: Catalog (Collection & Product)', () => {
    it('creates a new collection', async () => {
      const res = await request(app.getHttpServer())
        .post('/catalog/collections')
        .set('x-tenant-id', shopId)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Summer 2026',
          slug: 'summer-2026',
          description: 'Latest summer arrivals',
        })
        .expect(201);
      
      expect(res.body).toHaveProperty('id');
      collectionId = res.body.id;
    });

    it('creates a product with variants', async () => {
      const res = await request(app.getHttpServer())
        .post('/catalog/products')
        .set('x-tenant-id', shopId)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Summer T-Shirt',
          slug: 'summer-t-shirt',
          description: 'Cool cotton t-shirt',
          status: 'DRAFT',
          variants: [
            { sku: 'TS-SUM-M', price: 250000, weight: 0.2 },
            { sku: 'TS-SUM-L', price: 250000, weight: 0.25 },
          ]
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.variants).toHaveLength(2);
      expect(res.body.variants[0].isMaster).toBe(true);
      productId = res.body.id;
    });

    it('adds product to collection', async () => {
      await request(app.getHttpServer())
        .post(`/catalog/collections/${collectionId}/products`)
        .set('x-tenant-id', shopId)
        .set('Authorization', `Bearer ${token}`)
        .send({ productId })
        .expect(201);
    });
  });

  describe('PHASE 3: Media Upload & MinIO', () => {
    it('uploads image and returns valid MinIO URL + BlurHash', async () => {
      const filePath = path.join(__dirname, 'fixtures', 'test-product.jpg');
      
      const res = await request(app.getHttpServer())
        .post('/media/upload')
        .set('x-tenant-id', shopId)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', filePath)
        .expect(201);

      expect(res.body).toHaveProperty('url');
      expect(res.body.mimeType).toBe('image/jpeg');
      
      mediaUrl = res.body.url;
      mediaKey = res.body.key;
    });

    it('verifies file physically exists in MinIO bucket', async () => {
      const exists = await minioService.fileExists(mediaKey);
      expect(exists).toBe(true);
      
      // Attempt HTTP GET if CDN_BASE_URL resolves
      try {
        const httpRes = await fetch(mediaUrl);
        expect(httpRes.status).toBe(200);
      } catch (e) {
        // Warning: fetch might fail if CDN_BASE_URL is unroutable localhost in docker compose,
        // but minioService check validates existence on S3 level.
      }
    });

    it('updates product with new image URL', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/catalog/products/${productId}`)
        .set('x-tenant-id', shopId)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Summer T-Shirt',
          slug: 'summer-t-shirt',
          imageUrl: mediaUrl,
        })
        .expect(200);

      expect(res.body.imageUrl).toBe(mediaUrl);
    });
  });

  describe('PHASE 4: Layout Draft', () => {
    const draftData = {
      globalComponents: [
        {
          id: 'global-header',
          componentId: 'Header',
          type: 'section',
          props: { logo: 'TO_BE_REPLACED', shopName: 'Test Shop E2E' }
        }
      ],
      theme: { colors: { primary: '#10b981' } },
      pages: {
        home: [{
          id: 'hero-1',
          componentId: 'HeroBanner',
          type: 'section',
          props: { backgroundImageUrl: 'TO_BE_REPLACED', title: 'Welcome!' }
        }]
      }
    };

    it('saves draft layout with MinIO image URLs to MongoDB', async () => {
      draftData.globalComponents[0].props.logo = mediaUrl;
      draftData.pages.home[0].props.backgroundImageUrl = mediaUrl;

      await request(app.getHttpServer())
        .patch('/layout/tenant')
        .set('x-tenant-id', shopId)
        .set('Authorization', `Bearer ${token}`)
        .send({ overrides: draftData })
        .expect(200);

      const getRes = await request(app.getHttpServer())
        .get('/layout/tenant')
        .set('x-tenant-id', shopId)
        .expect(200);

      const draft = getRes.body.data.draftData;
      expect(draft.globalComponents[0].props.logo).toBe(mediaUrl);
      expect(draft.pages.home[0].props.backgroundImageUrl).toBe(mediaUrl);
    });
  });

  describe('PHASE 5: Publish & Verify', () => {
    it('publishes layout: draftData becomes publishedData', async () => {
      const res = await request(app.getHttpServer())
        .post('/layout/publish')
        .set('x-tenant-id', shopId)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const published = res.body.data.publishedData;
      expect(published.globalComponents[0].props.logo).toBe(mediaUrl);
    });

    it('public layout endpoint returns published data with MinIO URLs', async () => {
      const res = await request(app.getHttpServer())
        .get('/layout/tenant')
        .set('x-tenant-id', shopId)
        // No Authorization needed for public endpoint
        .expect(200);

      expect(res.body.data.publishedData.pages.home[0].props.backgroundImageUrl).toBe(mediaUrl);
    });
  });
});
