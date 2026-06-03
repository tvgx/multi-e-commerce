import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadMediaDto {
  @IsString()
  @IsNotEmpty()
  entityType: string; // 'product', 'shop_logo', 'avatar'
  
  @IsOptional()
  @IsString()
  entityId?: string;
}
