import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  IsIn,
} from 'class-validator';

export class CreateShippingMethodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  baseFee: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  freeThreshold?: number;

  @IsString()
  @IsOptional()
  estimatedDays?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  position?: number;
}

export class UpdateShippingMethodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  baseFee?: number;

  // null để bỏ ngưỡng miễn phí
  @IsOptional()
  freeThreshold?: number | null;

  @IsString()
  @IsOptional()
  estimatedDays?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  position?: number;
}

export class ShippingQuoteDto {
  @IsString()
  @IsNotEmpty()
  shippingMethodId: string;

  @IsNumber()
  @Min(0)
  subtotal: number;
}

export class UpdateShipmentDto {
  @IsString()
  @IsOptional()
  @IsIn(['pending', 'ready', 'shipped', 'delivered', 'returned', 'canceled'])
  state?: string;

  @IsString()
  @IsOptional()
  carrier?: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
