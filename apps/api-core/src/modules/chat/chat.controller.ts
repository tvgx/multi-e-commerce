import { Controller, Get, Post, Body, Req, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto, GetMessagesDto } from './dto/chat.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(BetterAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Req() req: any, @Query() query: PaginationDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return this.chatService.getConversations(userId, query);
  }

  @Get('messages')
  getMessages(@Req() req: any, @Query() query: GetMessagesDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return this.chatService.getMessages(userId, query);
  }

  @Post('messages')
  sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return this.chatService.sendMessage(userId, dto);
  }
}

