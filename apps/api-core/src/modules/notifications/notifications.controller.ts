import { Controller, Get, Patch, Param, Req, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/notifications.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';

@UseGuards(RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Req() req: any, @Query() query: GetNotificationsDto) {
    const userId = req.user?.id || 'mock-user-id';
    return this.notificationsService.getNotifications(userId, query);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.notificationsService.markAsRead(userId, id);
  }
}

