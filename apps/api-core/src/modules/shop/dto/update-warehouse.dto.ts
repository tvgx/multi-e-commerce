import { IsString, IsOptional } from 'class-validator';

// Địa chỉ kho hàng mặc định (nơi shipper đến lấy hàng).
// Lưu ý: không có global ValidationPipe → validate tay trong service.
export class UpdateWarehouseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  addressLine?: string;

  @IsString()
  @IsOptional()
  provinceCode?: string;

  @IsString()
  @IsOptional()
  wardCode?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
