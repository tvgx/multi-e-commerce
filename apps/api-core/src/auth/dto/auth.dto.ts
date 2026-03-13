import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Mật khẩu hoặc Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự' })
  password: string;

  @IsString()
  fullName: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Sai định dạng email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự' })
  password: string;
}
