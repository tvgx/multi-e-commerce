import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  // 0 = xoá item khỏi giỏ
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;
}
