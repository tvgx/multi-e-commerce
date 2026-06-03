import { Controller, Get, Patch, Param, Req, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/notifications.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';

import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@UseGuards(BetterAuthGuard, RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Public()
  @Get()
  getNotifications(@Req() req: any, @Query() query: GetNotificationsDto) {
    const userId = req.user?.id || 'mock-user-id'; // In a real app this should come from BetterAuth session
    return this.notificationsService.getNotifications(userId, query);
  }

  @Public()
  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.notificationsService.markAsRead(userId, id);
  }

  @Public()
  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    return this.notificationsService.markAllAsRead(userId);
  }
}

