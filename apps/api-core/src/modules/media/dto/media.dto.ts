import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadMediaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  entityType?: string; // 'product', 'collection', 'layout', 'layout_image', 'shop_logo', 'theme'

  @IsOptional()
  @IsString()
  entityId?: string;
}
