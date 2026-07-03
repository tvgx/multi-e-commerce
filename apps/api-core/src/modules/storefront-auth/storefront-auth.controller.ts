import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { StorefrontAuthService } from './storefront-auth.service';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { verifyJwt } from './jwt.utils';
import { StoreLoginDto, StoreRegisterDto } from './dto/store-auth.dto';

@Controller('storefront-auth')
export class StorefrontAuthController {
  constructor(private readonly authService: StorefrontAuthService) {}

  @Post('register')
  async register(@Body() body: StoreRegisterDto): Promise<BaseResponseDto<any>> {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: StoreLoginDto): Promise<BaseResponseDto<any>> {
    return this.authService.login(body);
  }

  @Post('change-password')
  async changePassword(
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ): Promise<BaseResponseDto<any>> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    // verifyJwt tự ném UnauthorizedException (401) khi token hỏng; lỗi nghiệp
    // vụ/DB từ service vẫn nổi lên đúng mã của nó (không bị che thành 401).
    const payload = verifyJwt(token);
    return this.authService.changePassword(body, payload.sub);
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader: string): Promise<BaseResponseDto<any>> {
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('Missing or invalid token');
    const token = authHeader.split(' ')[1];
    const payload = verifyJwt(token);
    return this.authService.getMe(payload.sub);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string, shopId: string, shopSlug: string }): Promise<BaseResponseDto<any>> {
    return this.authService.forgotPassword(body.email, body.shopId, body.shopSlug);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string, password: string }): Promise<BaseResponseDto<any>> {
    return this.authService.resetPassword(body.token, body.password);
  }

  // Sign in with Google (buyer). These are browser redirects, so they use
  // @Res() to 302 rather than returning a JSON envelope.

  @Get('google/start')
  async googleStart(
    @Query('shopSlug') shopSlug: string,
    @Query('redirect') redirect: string,
    @Res() res: Response,
  ): Promise<void> {
    const storefront = process.env.STOREFRONT_URL || 'http://localhost:3002';
    try {
      const url = await this.authService.getGoogleAuthUrl(shopSlug, redirect);
      res.redirect(url);
    } catch {
      res.redirect(`${storefront}/${shopSlug || ''}/account/login?error=google`);
    }
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const storefront = process.env.STOREFRONT_URL || 'http://localhost:3002';
    try {
      const { token, shopSlug, redirect } = await this.authService.handleGoogleCallback(code, state);
      // The storefront sets the httpOnly session cookie (correct origin/path).
      const cb = new URL(`${storefront}/${shopSlug}/account/oauth-callback`);
      cb.searchParams.set('token', token);
      if (redirect) cb.searchParams.set('redirect', redirect);
      res.redirect(cb.toString());
    } catch {
      res.redirect(`${storefront}/?error=google`);
    }
  }
}
