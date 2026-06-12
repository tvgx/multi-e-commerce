import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let queue: { add: jest.Mock };

  const order = { number: 'ORD-1', totalAmount: 1000, shippingAddress: 'Hanoi' };

  beforeEach(async () => {
    queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getQueueToken('email-queue'), useValue: queue },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  it('queues an order-confirmed email', async () => {
    await service.sendOrderConfirmation('a@x.dev', order);
    expect(queue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ to: 'a@x.dev', template: 'order-confirmed' }),
    );
  });

  it('queues an order-shipped email', async () => {
    await service.sendOrderShipped('a@x.dev', order);
    expect(queue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ template: 'order-shipped' }),
    );
  });

  it('queues a payment-confirmed email', async () => {
    await service.sendPaymentConfirmed('a@x.dev', order);
    expect(queue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ template: 'payment-confirmed' }),
    );
  });

  it('queues a reset-password email with the reset url in context', async () => {
    await service.sendResetPasswordEmail('a@x.dev', 'https://reset', 'Alice');
    expect(queue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({
        template: 'reset-password',
        context: expect.objectContaining({ resetUrl: 'https://reset', customerName: 'Alice' }),
      }),
    );
  });
});
