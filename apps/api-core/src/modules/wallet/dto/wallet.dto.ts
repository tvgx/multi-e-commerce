import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class TopupRequestDto {
  @IsNumber()
  @Min(1000)
  amount: number;
}

export class ResolveTopupDto {
  @IsString()
  @IsIn(['confirm', 'reject'])
  action: 'confirm' | 'reject';
}

export class AdjustWalletDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  // Dương = cộng tiền, âm = trừ tiền
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class ToggleWalletPaymentDto {
  active: boolean;
}
