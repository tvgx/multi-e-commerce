import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';

// TODO: Replace with real Hash algorithm (bcrypt / argon2)
const hashPasswordMock = (pass: string) => `hashed_${pass}`;
const comparePasswordMock = (pass: string, hash: string) => hash === `hashed_${pass}`;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<BaseResponseDto<any>> {
    try {
      // 1. Check if email exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new CustomException(
          ResponseCodes.USER_EXISTED,
          'User existed.',
          HttpStatus.CONFLICT,
        );
      }

      // 2. Create user
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hashPasswordMock(dto.password),
          fullName: dto.fullName,
          role: 'OWNER', // default
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      });

      return BaseResponseDto.success(user);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Exception error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(dto: LoginDto): Promise<BaseResponseDto<any>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      // Case: Not Existed OR Wrong Password => CODE_VERIFY_INCORRECT (9993) to avoid data leaking
      if (!user || !comparePasswordMock(dto.password, user.passwordHash)) {
        throw new CustomException(
          ResponseCodes.CODE_VERIFY_INCORRECT,
          'Code verify is incorrect',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // TODO: Generate real JWT
      const accessToken = `mock_jwt_for_${user.id}`;

      return BaseResponseDto.success({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Exception error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProfile(userId: string): Promise<BaseResponseDto<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) {
       throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    }

    return BaseResponseDto.success(user);
  }

  async changeUsername(userId: string, newName: string): Promise<BaseResponseDto<any>> {
     const user = await this.prisma.user.findUnique({ where: { id: userId }});
     if (!user) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);

     if (user.fullName === newName) {
       throw new CustomException(ResponseCodes.CHANGE_USERNAME_SAME_OTHER, 'Change Username: same other name', HttpStatus.BAD_REQUEST);
     }

     // TODO: Implement "30 days check" logic via a NameChangeHistory table
     // if (lastChanged < 30 days) {
     //    throw new CustomException(ResponseCodes.CHANGE_USERNAME_REQUIRES_30_DAYS, ...);
     // }

     await this.prisma.user.update({
       where: { id: userId },
       data: { fullName: newName }
     });

     return BaseResponseDto.success({ updated: true });
  }
}
