import { IsString, IsNotEmpty, IsOptional, IsUrl, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}
