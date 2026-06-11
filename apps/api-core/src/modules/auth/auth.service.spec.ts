import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { OWNER_AUTH, CUSTOMER_AUTH } from './auth.constants';
import { CustomException } from '../../common/exceptions/custom.exception';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let ownerAuth: { api: { getSession: jest.Mock } };
  let customerAuth: { api: { getSession: jest.Mock } };

  beforeEach(async () => {
    prisma = createMockPrisma();
    ownerAuth = { api: { getSession: jest.fn() } };
    customerAuth = { api: { getSession: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: OWNER_AUTH, useValue: ownerAuth },
        { provide: CUSTOMER_AUTH, useValue: customerAuth },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOwnerSession', () => {
    const req = { headers: { cookie: 'owner-session=abc' } } as any;

    it('returns the session from the owner auth instance', async () => {
      const session = { user: { id: 'u1' }, session: { id: 's1' } };
      ownerAuth.api.getSession.mockResolvedValue(session);

      await expect(service.getOwnerSession(req)).resolves.toEqual(session);
      expect(ownerAuth.api.getSession).toHaveBeenCalledTimes(1);
    });

    it('returns null when the auth instance throws', async () => {
      ownerAuth.api.getSession.mockRejectedValue(new Error('boom'));
      await expect(service.getOwnerSession(req)).resolves.toBeNull();
    });

    it('returns null (not the owner session) for customer flow boundary', async () => {
      ownerAuth.api.getSession.mockResolvedValue(null);
      await expect(service.getOwnerSession(req)).resolves.toBeNull();
    });
  });

  describe('getCustomerSession', () => {
    const req = { headers: { cookie: 'customer-session=xyz' } } as any;

    it('delegates to the customer auth instance', async () => {
      const session = { user: { id: 'c1' }, session: { id: 'cs1' } };
      customerAuth.api.getSession.mockResolvedValue(session);

      await expect(service.getCustomerSession(req)).resolves.toEqual(session);
      expect(customerAuth.api.getSession).toHaveBeenCalledTimes(1);
      expect(ownerAuth.api.getSession).not.toHaveBeenCalled();
    });

    it('returns null when the auth instance throws', async () => {
      customerAuth.api.getSession.mockRejectedValue(new Error('boom'));
      await expect(service.getCustomerSession(req)).resolves.toBeNull();
    });
  });

  describe('changeUsername', () => {
    it('throws TOKEN_INVALID (401) when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changeUsername('u1', 'New')).rejects.toMatchObject({
        code: ResponseCodes.TOKEN_INVALID,
        status: HttpStatus.UNAUTHORIZED,
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws CHANGE_USERNAME_SAME_OTHER when the new name equals the current name', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Same' });

      await expect(service.changeUsername('u1', 'Same')).rejects.toMatchObject({
        code: ResponseCodes.CHANGE_USERNAME_SAME_OTHER,
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('falls back to fullName when name is absent for the equality check', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', fullName: 'Legacy' });

      await expect(
        service.changeUsername('u1', 'Legacy'),
      ).rejects.toMatchObject({
        code: ResponseCodes.CHANGE_USERNAME_SAME_OTHER,
      });
    });

    it('updates the name and returns success', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Old' });
      prisma.user.update.mockResolvedValue({ id: 'u1', name: 'New' });

      const res = await service.changeUsername('u1', 'New');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { name: 'New' },
      });
      expect(res.code).toBe(ResponseCodes.SUCCESS);
      expect(res.data).toEqual({ updated: true });
    });

    it('wraps unexpected persistence errors as EXCEPTION_ERROR (500)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Old' });
      prisma.user.update.mockRejectedValue(new Error('db down'));

      await expect(service.changeUsername('u1', 'New')).rejects.toMatchObject({
        code: ResponseCodes.EXCEPTION_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('rethrows a CustomException without re-wrapping it', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const err = await service.changeUsername('u1', 'New').catch((e) => e);
      expect(err).toBeInstanceOf(CustomException);
      expect(err.code).toBe(ResponseCodes.TOKEN_INVALID);
    });
  });

  describe('updateProfile', () => {
    it('throws TOKEN_INVALID when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('u1', { fullName: 'A' } as any),
      ).rejects.toMatchObject({ code: ResponseCodes.TOKEN_INVALID });
    });

    it('persists profile fields and converts dateOfBirth to a Date', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.user.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'u1', ...data }),
      );

      const res = await service.updateProfile('u1', {
        fullName: 'Jane Doe',
        identityNumber: '0123',
        gender: 'FEMALE',
        dateOfBirth: '1990-01-01',
      } as any);

      const callArg = prisma.user.update.mock.calls[0][0];
      expect(callArg.where).toEqual({ id: 'u1' });
      expect(callArg.data.fullName).toBe('Jane Doe');
      expect(callArg.data.dateOfBirth).toBeInstanceOf(Date);
      expect(res.code).toBe(ResponseCodes.SUCCESS);
    });

    it('sets dateOfBirth to null when an empty string is supplied', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.user.update.mockResolvedValue({ id: 'u1' });

      await service.updateProfile('u1', { dateOfBirth: '' } as any);

      const data = prisma.user.update.mock.calls[0][0].data;
      expect(data.dateOfBirth).toBeNull();
    });

    it('omits dateOfBirth from the update when undefined', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.user.update.mockResolvedValue({ id: 'u1' });

      await service.updateProfile('u1', { fullName: 'X' } as any);

      const data = prisma.user.update.mock.calls[0][0].data;
      expect('dateOfBirth' in data).toBe(false);
    });

    it('wraps unexpected errors as EXCEPTION_ERROR (500)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.user.update.mockRejectedValue(new Error('db down'));

      await expect(
        service.updateProfile('u1', { fullName: 'X' } as any),
      ).rejects.toMatchObject({
        code: ResponseCodes.EXCEPTION_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('stub auth endpoints', () => {
    it('register echoes the payload in a success envelope', async () => {
      const res = await service.register({ email: 'a@b.com' });
      expect(res.success).toBe(true);
      expect(res.data).toMatchObject({ data: { email: 'a@b.com' } });
    });

    it('login/forgotPassword/resetPassword/changePassword/logout all succeed', async () => {
      await expect(service.login({}).then((r) => r.success)).resolves.toBe(true);
      await expect(
        service.forgotPassword({}).then((r) => r.success),
      ).resolves.toBe(true);
      await expect(
        service.resetPassword({}).then((r) => r.success),
      ).resolves.toBe(true);
      await expect(
        service.changePassword('u1', {}).then((r) => r.success),
      ).resolves.toBe(true);
      await expect(service.logout('u1').then((r) => r.success)).resolves.toBe(
        true,
      );
    });
  });
});
