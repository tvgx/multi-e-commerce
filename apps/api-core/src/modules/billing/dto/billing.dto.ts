import { IsOptional, IsString } from 'class-validator';

// Lưu ý: app không bật global ValidationPipe nên decorator chỉ mang tính tài
// liệu — service tự validate tay (convention của codebase).

export class SubscribeDto {
  @IsOptional()
  @IsString()
  planKey?: string;

  @IsOptional()
  @IsString()
  planId?: string;
}

export class BillingConfirmDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  action?: 'confirm' | 'reject';
}
