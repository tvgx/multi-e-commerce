import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateShopDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  productsPerPage?: number;
}

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  mapAddress?: string;

  @IsOptional()
  @IsUrl()
  licenseImageUrl?: string;

  @IsOptional()
  productsPerPage?: number;
}
