import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  productsPerPage?: number;
}
