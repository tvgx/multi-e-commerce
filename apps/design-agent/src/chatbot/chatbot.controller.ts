import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatResponseDto, validateChatRequest } from './dto/chat.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';

@Controller('design-agent')
@UseGuards(SessionAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  /**
   * POST /design-agent/chat
   * body: { message, conversation_id, tenant_id }
   */
  @Post('chat')
  async chat(@Body() body: unknown): Promise<ChatResponseDto> {
    let dto: ReturnType<typeof validateChatRequest>;
    try {
      dto = validateChatRequest(body);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Invalid request body.',
      );
    }

    const result = await this.chatbot.chat({
      message: dto.message,
      conversationId: dto.conversation_id,
      tenantId: dto.tenant_id,
    });

    return {
      conversation_id: result.conversation_id,
      reply: result.reply,
      tool_calls: result.tool_calls,
      retrieved_sections: result.retrieved_sections,
    };
  }
}
