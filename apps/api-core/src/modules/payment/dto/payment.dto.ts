import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsNumber()
  amount: number;
}

export class PaymentWebhookDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  // Merchant order reference echoed back by the gateway — identifies which order
  // this callback settles (PAY-3). Required at runtime (no global ValidationPipe).
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  signature?: string;
}

export class TokenInfoDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
