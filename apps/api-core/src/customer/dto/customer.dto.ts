import { IsEmail, IsString } from 'class-validator';

export class SubscribeDto {
  @IsString()
  shopId: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;
}
