import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SystemCacheService } from './cache.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const redisHost = configService.get<string>('REDIS_HOST');

        if (redisUrl || redisHost) {
          const store = await redisStore({
            url: redisUrl,
            socket: redisHost
              ? {
                  host: redisHost,
                  port: configService.get<number>('REDIS_PORT', 6379),
                }
              : undefined,
            password: configService.get<string>('REDIS_PASSWORD'),
            ttl: 60000,
          });
          return { store: () => store };
        }

        return {
          ttl: 60000,
          max: 1000,
        };
      },
    }),
  ],
  providers: [SystemCacheService],
  exports: [SystemCacheService, CacheModule],
})
export class SystemCacheModule {}
