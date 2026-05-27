import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  shopId: string;

  @IsString()
  customerName: string;

  @IsString()
  customerEmail: string;

  @IsString()
  customerPhone?: string;

  @IsString()
  shippingAddress: string;

  @IsString()
  paymentProvider: string; // e.g., 'COD', 'MOCK_GATEWAY'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  promoCode?: string;
}
