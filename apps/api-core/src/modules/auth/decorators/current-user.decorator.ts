import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * @CurrentUser()
 *
 * Decorator để lấy user hiện tại từ request sau khi đã được xác thực bởi BetterAuthGuard.
 *
 * Ví dụ sử dụng:
 *   @Get('profile')
 *   @UseGuards(BetterAuthGuard)
 *   async getProfile(@CurrentUser() user: AuthUser) {
 *     return user;
 *   }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any).user;
  },
);
