import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class LineItemDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  quantity: number;
}

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems: LineItemDto[];

  @IsString()
  @IsOptional()
  promotionCode?: string;

  @IsString()
  @IsOptional()
  shippingMethodId?: string;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shippingAddress?: ShippingAddressDto;
}
