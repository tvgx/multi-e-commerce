import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { AppModule } from './app.module';
import { CustomExceptionFilter } from './common/exceptions/custom-exception.filter';
import { ResponseLoggerInterceptor } from './common/interceptors/response-logger.interceptor';
import { toNodeHandler } from 'better-auth/node';
import { OWNER_AUTH, CUSTOMER_AUTH } from './modules/auth/auth.constants';
import type { OwnerAuth } from './modules/auth/owner-auth.config';
import type { CustomerAuth } from './modules/auth/customer-auth.config';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug', 'fatal'],
  });

  // Enable CORS cho admin và storefront.
  // Multi-tenant: mỗi shop là một subdomain (vd shop1.tvgx1.id.vn) gọi thẳng API
  // từ browser kèm credentials → không thể whitelist tĩnh. Dùng function origin:
  //  - khớp chính xác ADMIN_URL / STOREFRONT_URL + localhost dev
  //  - khớp mọi subdomain của ROOT_DOMAIN (vd *.tvgx1.id.vn) khi đặt env này
  const allowedExactOrigins = new Set(
    [
      process.env.ADMIN_URL || 'http://localhost:3001',
      process.env.STOREFRONT_URL || 'http://localhost:3002',
    ].filter(Boolean),
  );
  const rootDomain = process.env.ROOT_DOMAIN; // vd "tvgx1.id.vn" (không có dấu chấm đầu)
  const isAllowedOrigin = (origin?: string): boolean => {
    // Không có Origin header (same-origin, curl, SSR server-to-server) → cho phép
    if (!origin) return true;
    if (allowedExactOrigins.has(origin)) return true;
    if (rootDomain) {
      try {
        const host = new URL(origin).hostname;
        if (host === rootDomain || host.endsWith(`.${rootDomain}`)) return true;
      } catch {
        return false;
      }
    }
    return false;
  };
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => callback(null, isAllowedOrigin(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-type', 'x-shop-id', 'x-tenant-id', 'x-request-id'],
  });

  // Gzip responses — layout/product JSON payloads compress well
  app.use(compression());

  // Global prefix /api cho tất cả NestJS controllers.
  // NOTE: Better Auth được mount thủ công qua app.use() bên dưới,
  // không cần exclude ở đây vì Express xử lý app.use() trước NestJS routing.
  app.setGlobalPrefix('api');

  // Lấy auth instances từ NestJS DI container (registered via factory providers)
  const ownerAuth = app.get<OwnerAuth>(OWNER_AUTH);
  const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);

  // Mount Better Auth handlers trước NestJS middleware
  // Owner Auth: /api/auth/owner/* (dành cho admin dashboard)
  app.use('/api/auth/owner', toNodeHandler(ownerAuth));

  // Customer Auth: /api/auth/customer/* (dành cho storefront)
  app.use('/api/auth/customer', toNodeHandler(customerAuth));

  // Swagger UI — liệt kê và chạy thử API tại /api/docs
  // (các route Better Auth mount qua app.use() ở trên không xuất hiện ở đây)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Core')
    .setDescription('Multi-tenant e-commerce API. Hầu hết endpoint cần header x-shop-id (tenant context).')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Customer/Owner session token' },
      'bearer',
    )
    .addGlobalParameters({
      name: 'x-shop-id',
      in: 'header',
      required: false,
      schema: { type: 'string' },
      description: 'Shop ID (tenant context) — bắt buộc với các endpoint theo shop',
    })
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: 'API Core Docs',
    swaggerOptions: {
      persistAuthorization: true, // giữ token khi reload trang
      requestCredentials: 'include', // gửi cookie session (better-auth) khi Try it out
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Global Exception Filter
  app.useGlobalFilters(new CustomExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(new ResponseLoggerInterceptor());

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('Infrastructure');
  logger.log(`=================================================`);
  logger.log(`🚀 API Core running on: http://localhost:${port}`);
  logger.log(`📖 Swagger UI: http://localhost:${port}/api/docs`);
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
