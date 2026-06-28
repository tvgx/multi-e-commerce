import { createOwnerAuth } from './owner-auth.config';
import type { EmailService } from '../email/email.service';

/**
 * Regression guard cho P0-1 (COMPLETION-HANDOFF): trước đây owner auth KHÔNG cấu
 * hình `emailAndPassword.sendResetPassword`, nên `forgetPassword()` ném lỗi và
 * email reset mật khẩu owner không bao giờ được gửi (lỗi bị `catch {}` nuốt).
 *
 * `better-auth` được stub trong jest (test/stubs/better-auth.js) và phơi ra
 * `options` đã truyền vào, nên ta kiểm tra trực tiếp callback đã được nối đúng.
 */
describe('createOwnerAuth', () => {
  const prisma = {} as any;

  function makeEmail(): jest.Mocked<Pick<EmailService, 'sendResetPasswordEmail'>> {
    return {
      sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('bật emailAndPassword và nối sendResetPassword', () => {
    const auth = createOwnerAuth(prisma, makeEmail() as any) as any;
    expect(auth.options.emailAndPassword.enabled).toBe(true);
    expect(typeof auth.options.emailAndPassword.sendResetPassword).toBe(
      'function',
    );
  });

  it('sendResetPassword gửi email với đúng địa chỉ, link và tên user', async () => {
    const email = makeEmail();
    const auth = createOwnerAuth(prisma, email as any) as any;

    await auth.options.emailAndPassword.sendResetPassword({
      user: { email: 'owner@shop.com', name: 'Chủ shop' },
      url: 'https://admin.example.com/reset-password?token=abc123',
    });

    expect(email.sendResetPasswordEmail).toHaveBeenCalledWith(
      'owner@shop.com',
      'https://admin.example.com/reset-password?token=abc123',
      'Chủ shop',
    );
  });

  it('dùng tên mặc định khi user.name vắng mặt', async () => {
    const email = makeEmail();
    const auth = createOwnerAuth(prisma, email as any) as any;

    await auth.options.emailAndPassword.sendResetPassword({
      user: { email: 'noname@shop.com', name: null },
      url: 'https://admin.example.com/reset-password?token=xyz',
    });

    expect(email.sendResetPasswordEmail).toHaveBeenCalledWith(
      'noname@shop.com',
      'https://admin.example.com/reset-password?token=xyz',
      'bạn',
    );
  });
});
