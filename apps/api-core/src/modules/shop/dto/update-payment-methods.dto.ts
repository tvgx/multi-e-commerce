import { IsBoolean, IsOptional } from 'class-validator';

// Bật/tắt phương thức thanh toán cơ bản (COD, Chuyển khoản) cho shop.
export class UpdatePaymentMethodsDto {
  @IsBoolean()
  @IsOptional()
  cod?: boolean;

  @IsBoolean()
  @IsOptional()
  bankTransfer?: boolean;
}
