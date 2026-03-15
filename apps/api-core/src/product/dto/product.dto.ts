import { IsString, IsNumber, IsOptional, IsArray, Min, Max, IsObject } from 'class-validator';

export class CreateProductDto {
  @IsString()
  shopId: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  sku: string; // SKU is required for the variant

  @IsNumber()
  @Min(0)
  @Max(30000000) // 30M policy
  basePrice: number;

  @IsOptional()
  @IsNumber()
  @Max(20) // 20KG policy
  weight?: number;

  @IsOptional()
  @IsNumber()
  inStock?: number;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsObject()
  extraMetadata?: Record<string, any>;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30000000)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Max(20)
  weight?: number;

  @IsOptional()
  @IsNumber()
  inStock?: number;

  @IsOptional()
  @IsObject()
  extraMetadata?: Record<string, any>;
}
