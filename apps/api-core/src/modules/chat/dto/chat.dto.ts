import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  conversationId?: string; // If null, creates a new conversation
}

export class GetMessagesDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
