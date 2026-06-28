import { IsString } from 'class-validator';

/**
 * Tên miền riêng người bán muốn trỏ về cửa hàng.
 * Lưu ý: api-core KHÔNG có global ValidationPipe, nên decorator chỉ để tài liệu —
 * ShopService.setCustomDomain validate + chuẩn hoá tay.
 */
export class SetDomainDto {
  @IsString()
  customDomain!: string;
}
