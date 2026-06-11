import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BetterAuthGuard } from './guards/better-auth.guard';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authService: Record<string, jest.Mock>;

  // Mutable per-test identity injected by the overridden guard.
  let currentUser: Record<string, unknown> | null;

  beforeAll(async () => {
    authService = {
      changeUsername: jest.fn(),
      updateProfile: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(BetterAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          if (currentUser) {
            req.user = currentUser;
            req.authType = currentUser.authType ?? 'owner';
          }
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = { id: 'u1', email: 'u@test.com', authType: 'owner' };
  });

  describe('GET /auth/health (public)', () => {
    it('returns ok', async () => {
      const res = await request(app.getHttpServer()).get('/auth/health');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ResponseCodes.SUCCESS);
      expect(res.body.data).toEqual({ status: 'ok', service: 'auth' });
    });
  });

  describe('GET /auth/me', () => {
    it('echoes the authenticated user', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: 'u1', email: 'u@test.com' });
    });
  });

  describe('GET /auth/verify-session', () => {
    it('reports the session as authenticated', async () => {
      const res = await request(app.getHttpServer()).get('/auth/verify-session');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        authenticated: true,
        userId: 'u1',
        email: 'u@test.com',
      });
    });
  });

  describe('PUT /auth/change-username', () => {
    it('rejects an empty newName with 400', async () => {
      const res = await request(app.getHttpServer())
        .put('/auth/change-username')
        .send({ newName: '   ' });
      expect(res.status).toBe(400);
      expect(authService.changeUsername).not.toHaveBeenCalled();
    });

    it('delegates to the service with the user id and new name', async () => {
      authService.changeUsername.mockResolvedValue(
        BaseResponseDto.success({ updated: true }),
      );
      const res = await request(app.getHttpServer())
        .put('/auth/change-username')
        .send({ newName: 'Fresh Name' });
      expect(res.status).toBe(200);
      expect(authService.changeUsername).toHaveBeenCalledWith(
        'u1',
        'Fresh Name',
      );
    });
  });

  describe('PUT /auth/profile', () => {
    it('forbids non-owner auth types with 403', async () => {
      currentUser = { id: 'c1', authType: 'customer' };
      const res = await request(app.getHttpServer())
        .put('/auth/profile')
        .send({ fullName: 'X' });
      expect(res.status).toBe(403);
      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('delegates to the service for owners', async () => {
      authService.updateProfile.mockResolvedValue(
        BaseResponseDto.success({ id: 'u1' }),
      );
      const res = await request(app.getHttpServer())
        .put('/auth/profile')
        .send({ fullName: 'Owner Name' });
      expect(res.status).toBe(200);
      expect(authService.updateProfile).toHaveBeenCalledWith('u1', {
        fullName: 'Owner Name',
      });
    });
  });

  describe('public auth endpoints', () => {
    it('POST /auth/register delegates to the service', async () => {
      authService.register.mockResolvedValue(BaseResponseDto.success({}));
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new@test.com', password: 'secret' });
      expect(res.status).toBe(201);
      expect(authService.register).toHaveBeenCalled();
    });

    it('POST /auth/login delegates to the service', async () => {
      authService.login.mockResolvedValue(BaseResponseDto.success({}));
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'x' });
      expect(res.status).toBe(201);
      expect(authService.login).toHaveBeenCalled();
    });

    it('POST /auth/logout delegates with the user id', async () => {
      authService.logout.mockResolvedValue(BaseResponseDto.success({}));
      const res = await request(app.getHttpServer()).post('/auth/logout');
      expect(res.status).toBe(201);
      expect(authService.logout).toHaveBeenCalledWith('u1');
    });
  });
});
