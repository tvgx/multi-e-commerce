import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { CustomExceptionFilter } from './common/exceptions/custom-exception.filter';
import { toNodeHandler } from 'better-auth/node';
import { OWNER_AUTH, CUSTOMER_AUTH } from './modules/auth/auth.constants';
import type { OwnerAuth } from './modules/auth/owner-auth.config';
import type { CustomerAuth } from './modules/auth/customer-auth.config';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS cho admin và storefront
  app.enableCors({
    origin: [
      process.env.ADMIN_URL || 'http://localhost:3001',
      process.env.STOREFRONT_URL || 'http://localhost:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-type', 'x-shop-id', 'x-tenant-id', 'x-request-id'],
  });

  // Global prefix /api cho tất cả NestJS controllers
  // Exclude: Better Auth đã tự mount ở /api/auth/* nên không cần prefix thêm
  app.setGlobalPrefix('api', {
    exclude: ['/api/auth/owner/*path', '/api/auth/customer/*path'],
  });

  // Lấy auth instances từ NestJS DI container (registered via factory providers)
  const ownerAuth = app.get<OwnerAuth>(OWNER_AUTH);
  const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);

  // Mount Better Auth handlers trước NestJS middleware
  // Owner Auth: /api/auth/owner/* (dành cho admin dashboard)
  app.use('/api/auth/owner', toNodeHandler(ownerAuth));

  // Customer Auth: /api/auth/customer/* (dành cho storefront)
  app.use('/api/auth/customer', toNodeHandler(customerAuth));

  // Global Exception Filter
  app.useGlobalFilters(new CustomExceptionFilter());

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('Infrastructure');
  logger.log(`=================================================`);
  logger.log(`🚀 API Core running on: http://localhost:${port}`);
  logger.log(`🔐 Owner Auth: http://localhost:${port}/api/auth/owner`);
  logger.log(`👤 Customer Auth: http://localhost:${port}/api/auth/customer`);

  // Supabase (Postgres)
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('supabase')) {
    logger.log(
      `🐘 Postgres (Supabase): Connected → ${dbUrl.split('@')[1] || 'Supabase'}`,
    );
  }

  // MongoDB Atlas
  const mongoUrl = process.env.MONGO_DB_ATLAS || '';
  if (mongoUrl.includes('mongodb.net')) {
    logger.log(
      `🍃 MongoDB (Atlas): Connected → ${mongoUrl.split('@')[1]?.split('/')[0] || 'Atlas'}`,
    );
  }

  // MinIO
  const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const minioPort = process.env.MINIO_PORT || '9000';
  logger.log(`🪣 MinIO Storage: http://${minioEndpoint}:${minioPort}`);
  logger.log(`=================================================`);
}
bootstrap();
