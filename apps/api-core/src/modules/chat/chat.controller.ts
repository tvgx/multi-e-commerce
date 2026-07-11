import { Controller, Get, Post, Body, Param, Req, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { SendMessageDto, GetMessagesDto } from './dto/chat.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * Chat buyer↔seller (TODO 18). Gửi tin qua HTTP có xác thực; ChatGateway chỉ
 * broadcast. Buyer đi qua BFF storefront (StorefrontAuthGuard — JWT trong cookie
 * httpOnly); seller gọi thẳng bằng better-auth cookie như các API admin khác.
 */
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  // ── Buyer (storefront) ────────────────────────────────────────────────

  @UseGuards(StorefrontAuthGuard)
  @Get('messages')
  getMessages(@Req() req: any, @Query() query: GetMessagesDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return this.chatService.getMessages(userId, query);
  }

  @UseGuards(StorefrontAuthGuard)
  @Post('messages')
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');

    const result = await this.chatService.sendMessageAs({ role: 'customer', id: userId }, dto);
    const shopId = this.tenantService.getTenantId()!;
    this.chatGateway.broadcastMessage(shopId, result.customerId, result.data);

    // Notify seller realtime (NotificationBell) — non-fatal.
    this.notifyShopOwner(shopId, dto.content).catch((err) =>
      console.error('Chat notification error', err),
    );

    return result;
  }

  private async notifyShopOwner(shopId: string, content: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });
    if (!shop?.ownerId) return;
    await this.notificationsGateway.notifyUser(
      shopId,
      shop.ownerId,
      'OWNER',
      'CHAT_MESSAGE',
      'Tin nhắn mới từ khách hàng',
      content.length > 120 ? `${content.slice(0, 120)}…` : content,
    );
  }

  // ── Seller (admin) ────────────────────────────────────────────────────

  @UseGuards(BetterAuthGuard)
  @Get('conversations')
  getConversations(@Req() req: any, @Query() query: PaginationDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return this.chatService.getConversations(userId, query);
  }

  @UseGuards(BetterAuthGuard)
  @Get('sessions')
  getSessions(@Query() query: PaginationDto) {
    return this.chatService.getShopSessions(query);
  }

  @UseGuards(BetterAuthGuard)
  @Get('sessions/:id/messages')
  getSessionMessages(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.chatService.getSessionMessages(id, query);
  }

  @UseGuards(BetterAuthGuard)
  @Post('sessions/:id/messages')
  async sendAdminMessage(@Req() req: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');

    const result = await this.chatService.sendMessageAs(
      { role: 'admin', id: userId },
      { ...dto, conversationId: id },
    );
    const shopId = this.tenantService.getTenantId()!;
    this.chatGateway.broadcastMessage(shopId, result.customerId, result.data);

    // Notify buyer realtime (toast trên storefront) — non-fatal.
    this.notificationsGateway
      .notifyUser(
        shopId,
        result.customerId,
        'CUSTOMER',
        'CHAT_MESSAGE',
        'Người bán đã trả lời tin nhắn của bạn',
        dto.content.length > 120 ? `${dto.content.slice(0, 120)}…` : dto.content,
      )
      .catch((err) => console.error('Chat notification error', err));

    return result;
  }
}
