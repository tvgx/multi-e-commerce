import { IsEnum } from 'class-validator';

export enum PaymentConfirmationAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

export class ConfirmPaymentDto {
  @IsEnum(PaymentConfirmationAction)
  action!: PaymentConfirmationAction;
}
