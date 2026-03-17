import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CartItemDto {
  @IsString()
  productId: string;

  @IsString()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  title?: string;
  
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class AddToCartDto extends CartItemDto {}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
