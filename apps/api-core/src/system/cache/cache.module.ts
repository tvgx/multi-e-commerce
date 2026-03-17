import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SystemCacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.register({
      ttl: 60000, // default cache for 60 seconds
      max: 100, // default maximum 100 items in cache
    }),
  ],
  providers: [SystemCacheService],
  exports: [SystemCacheService, CacheModule],
})
export class SystemCacheModule { }
