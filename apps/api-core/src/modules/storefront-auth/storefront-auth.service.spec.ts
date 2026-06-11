import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { StorefrontAuthService } from './storefront-auth.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { TenantService } from '../../common/services/tenant.service';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pw'),
  compare: jest.fn(),
}));

describe('StorefrontAuthService', () => {
  let service: StorefrontAuthService;
  let prisma: MockPrisma;
  let email: { sendResetPasswordEmail: jest.Mock };
  let tenant: { getTenantId: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrisma();
    email = { sendResetPasswordEmail: jest.fn() };
    tenant = { getTenantId: jest.fn().mockReturnValue('shop-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorefrontAuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(StorefrontAuthService);
    (bcrypt.compare as jest.Mock).mockReset().mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockClear();
  });

  describe('register', () => {
    it('throws PARAM_VALUE_INVALID when shop context is missing', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(
        service.register({ email: 'a@b.com', password: 'x' }),
      ).rejects.toMatchObject({ code: ResponseCodes.PARAM_VALUE_INVALID });
    });

    it('throws PARAM_VALUE_INVALID when email or password missing', async () => {
      await expect(service.register({ email: 'a@b.com' })).rejects.toMatchObject(
        { code: ResponseCodes.PARAM_VALUE_INVALID },
      );
    });

    it('throws NO_DATA_END_OF_LIST (404) when the shop does not exist', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(
        service.register({ email: 'a@b.com', password: 'x' }),
      ).rejects.toMatchObject({
        code: ResponseCodes.NO_DATA_END_OF_LIST,
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('throws USER_EXISTED (409) when the customer already exists', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: 'shop-1' });
      prisma.customer.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({ email: 'a@b.com', password: 'x' }),
      ).rejects.toMatchObject({
        code: ResponseCodes.USER_EXISTED,
        status: HttpStatus.CONFLICT,
      });
    });

    it('hashes the password, creates customer + account, and returns a token', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: 'shop-1' });
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue({
        id: 'cust-1',
        email: 'a@b.com',
        name: 'Alice',
      });
      prisma.customerAccount.create.mockResolvedValue({ id: 'acc-1' });

      const res = await service.register({
        email: 'a@b.com',
        password: 'secret',
        fullName: 'Alice',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: { email: 'a@b.com', name: 'Alice', shopId: 'shop-1' },
      });
      expect(prisma.customerAccount.create).toHaveBeenCalled();
      expect(typeof res.data.token).toBe('string');
      expect(res.data.token.split('.')).toHaveLength(3);
      expect(res.data.customer).toEqual({
        id: 'cust-1',
        email: 'a@b.com',
        name: 'Alice',
      });
    });
  });

  describe('login', () => {
    it('throws PASSWORD_NOT_CORRECT (401) when the customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'a@b.com', password: 'x' }),
      ).rejects.toMatchObject({
        code: ResponseCodes.PASSWORD_NOT_CORRECT,
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('throws when no credential account with a password exists', async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
      prisma.customerAccount.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ email: 'a@b.com', password: 'x' }),
      ).rejects.toMatchObject({ code: ResponseCodes.PASSWORD_NOT_CORRECT });
    });

    it('throws when the password does not match', async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
      prisma.customerAccount.findFirst.mockResolvedValue({ password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: 'a@b.com', password: 'bad' }),
      ).rejects.toMatchObject({ code: ResponseCodes.PASSWORD_NOT_CORRECT });
    });

    it('returns a token and customer on valid credentials', async () => {
      prisma.customer.findUnique.mockResolvedValue({
        id: 'cust-1',
        email: 'a@b.com',
        name: 'Alice',
      });
      prisma.customerAccount.findFirst.mockResolvedValue({ password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await service.login({ email: 'a@b.com', password: 'secret' });
      expect(res.success).toBe(true);
      expect(typeof res.data.token).toBe('string');
      expect(res.data.customer.id).toBe('cust-1');
    });
  });

  describe('getMe', () => {
    it('throws NO_DATA_END_OF_LIST (404) when not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      await expect(service.getMe('cust-x')).rejects.toMatchObject({
        code: ResponseCodes.NO_DATA_END_OF_LIST,
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('returns the customer profile', async () => {
      prisma.customer.findUnique.mockResolvedValue({
        id: 'cust-1',
        email: 'a@b.com',
      });
      const res = await service.getMe('cust-1');
      expect(res.data).toMatchObject({ id: 'cust-1' });
    });
  });

  describe('forgotPassword', () => {
    it('does not leak existence: returns generic message and sends no email when missing', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      const res = await service.forgotPassword('a@b.com', 'shop-1', 'my-shop');
      expect(res.success).toBe(true);
      expect(email.sendResetPasswordEmail).not.toHaveBeenCalled();
      expect(prisma.customerVerification.create).not.toHaveBeenCalled();
    });

    it('creates a verification token and sends the reset email when the customer exists', async () => {
      prisma.customer.findUnique.mockResolvedValue({
        id: 'cust-1',
        name: 'Alice',
      });
      const res = await service.forgotPassword('a@b.com', 'shop-1', 'my-shop');
      expect(prisma.customerVerification.create).toHaveBeenCalled();
      expect(email.sendResetPasswordEmail).toHaveBeenCalledWith(
        'a@b.com',
        expect.stringContaining('/my-shop/account/reset-password?token='),
        'Alice',
      );
      expect(res.success).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('throws PARAM_VALUE_INVALID for an invalid/expired token', async () => {
      prisma.customerVerification.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword('tok', 'newpw')).rejects.toMatchObject({
        code: ResponseCodes.PARAM_VALUE_INVALID,
      });
    });

    it('throws NO_DATA_END_OF_LIST when the customer is gone', async () => {
      prisma.customerVerification.findFirst.mockResolvedValue({
        id: 'v1',
        identifier: 'a@b.com',
      });
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword('tok', 'newpw')).rejects.toMatchObject({
        code: ResponseCodes.NO_DATA_END_OF_LIST,
      });
    });

    it('updates the account password and consumes the token', async () => {
      prisma.customerVerification.findFirst.mockResolvedValue({
        id: 'v1',
        identifier: 'a@b.com',
      });
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1' });
      prisma.customerAccount.findFirst.mockResolvedValue({ id: 'acc-1' });

      const res = await service.resetPassword('tok', 'newpw');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpw', 10);
      expect(prisma.customerAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { password: 'hashed-pw' },
      });
      expect(prisma.customerVerification.delete).toHaveBeenCalledWith({
        where: { id: 'v1' },
      });
      expect(res.success).toBe(true);
    });
  });
});
