import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class StoreLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class StoreRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;
}
