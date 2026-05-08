import { SetMetadata } from '@nestjs/common';

/**
 * @Public()
 *
 * Decorator để đánh dấu các endpoint không cần xác thực.
 * BetterAuthGuard sẽ bỏ qua các endpoint này.
 *
 * Ví dụ sử dụng:
 *   @Public()
 *   @Get('health')
 *   async healthCheck() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
