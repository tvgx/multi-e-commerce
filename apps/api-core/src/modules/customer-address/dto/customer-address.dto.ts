import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAddressDto {
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
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
