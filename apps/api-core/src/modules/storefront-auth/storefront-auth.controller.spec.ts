import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StorefrontAuthController } from './storefront-auth.controller';
import { StorefrontAuthService } from './storefront-auth.service';
import { signJwt } from './jwt.utils';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

describe('StorefrontAuthController (integration)', () => {
  let app: INestApplication;
  let authService: Record<string, jest.Mock>;

  beforeAll(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      changePassword: jest.fn(),
      getMe: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorefrontAuthController],
      providers: [
        { provide: StorefrontAuthService, useValue: authService },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('POST /storefront-auth/register delegates to the service', async () => {
    authService.register.mockResolvedValue(BaseResponseDto.success({ id: '1' }));
    const res = await request(app.getHttpServer())
      .post('/storefront-auth/register')
      .send({ email: 'a@b.com', password: 'x', shopId: 's1' });
    expect(res.status).toBe(201);
    expect(authService.register).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'x',
      shopId: 's1',
    });
  });

  it('POST /storefront-auth/login delegates to the service', async () => {
    authService.login.mockResolvedValue(BaseResponseDto.success({ token: 't' }));
    const res = await request(app.getHttpServer())
      .post('/storefront-auth/login')
      .send({ email: 'a@b.com', password: 'x', shopId: 's1' });
    expect(res.status).toBe(201);
    expect(authService.login).toHaveBeenCalled();
  });

  describe('GET /storefront-auth/me', () => {
    it('returns 401 when the Authorization header is missing', async () => {
      const res = await request(app.getHttpServer()).get('/storefront-auth/me');
      expect(res.status).toBe(401);
      expect(authService.getMe).not.toHaveBeenCalled();
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/storefront-auth/me')
        .set('Authorization', 'Bearer not.a.jwt');
      expect(res.status).toBe(401);
    });

    it('verifies the token and delegates with the subject id', async () => {
      authService.getMe.mockResolvedValue(BaseResponseDto.success({ id: 'c1' }));
      const token = signJwt({ sub: 'c1', email: 'a@b.com', shopId: 's1' });
      const res = await request(app.getHttpServer())
        .get('/storefront-auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(authService.getMe).toHaveBeenCalledWith('c1');
    });
  });

  describe('POST /storefront-auth/change-password', () => {
    it('returns 401 without a Bearer token', async () => {
      const res = await request(app.getHttpServer())
        .post('/storefront-auth/change-password')
        .send({ oldPassword: 'a', newPassword: 'b' });
      expect(res.status).toBe(401);
    });

    it('delegates with the verified subject id', async () => {
      authService.changePassword.mockResolvedValue(BaseResponseDto.success({}));
      const token = signJwt({ sub: 'c1' });
      const res = await request(app.getHttpServer())
        .post('/storefront-auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'b' });
      expect(res.status).toBe(201);
      expect(authService.changePassword).toHaveBeenCalledWith(
        { newPassword: 'b' },
        'c1',
      );
    });
  });

  it('POST /storefront-auth/forgot-password delegates the three fields', async () => {
    authService.forgotPassword.mockResolvedValue(BaseResponseDto.success({}));
    const res = await request(app.getHttpServer())
      .post('/storefront-auth/forgot-password')
      .send({ email: 'a@b.com', shopId: 's1', shopSlug: 'my-shop' });
    expect(res.status).toBe(201);
    expect(authService.forgotPassword).toHaveBeenCalledWith(
      'a@b.com',
      's1',
      'my-shop',
    );
  });

  it('POST /storefront-auth/reset-password delegates token + password', async () => {
    authService.resetPassword.mockResolvedValue(BaseResponseDto.success({}));
    const res = await request(app.getHttpServer())
      .post('/storefront-auth/reset-password')
      .send({ token: 'tok', password: 'newpw' });
    expect(res.status).toBe(201);
    expect(authService.resetPassword).toHaveBeenCalledWith('tok', 'newpw');
  });
});
