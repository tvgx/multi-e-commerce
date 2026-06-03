import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GetOrdersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  paymentState?: string;

  @IsOptional()
  @IsString()
  shipmentState?: string;
}
