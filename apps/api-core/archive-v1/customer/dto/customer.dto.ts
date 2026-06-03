import { IsEmail, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubscribeDto {
  @IsString()
  shopId: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;
}

export class CreateCustomerDto {
  @IsString()
  shopId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateCustomerDto {
  @IsString()
  shopId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  image?: string;
}

export class CustomerProfileUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  image?: string;
}

export class GetCustomersQueryDto {
  @IsString()
  shopId: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}

