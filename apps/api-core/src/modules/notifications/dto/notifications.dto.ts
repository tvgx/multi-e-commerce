import { IsOptional, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GetNotificationsDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}
