import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class LineItemDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  quantity: number;
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
}
