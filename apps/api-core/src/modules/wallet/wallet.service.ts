import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { randomUUID } from 'crypto';
import { TopupRequestDto, AdjustWalletDto } from './dto/wallet.dto';

/** Loại PaymentMethod dùng cho thanh toán bằng ví */
export const WALLET_PAYMENT_TYPE = 'Wallet';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  // ==========================================
  // Core helpers (dùng được trong transaction của module khác)
  // ==========================================

  async getOrCreate(customerId: string, shopId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.wallet.upsert({
      where: { customerId },
      update: {},
      create: { shopId, customerId },
    });
  }

  /** Cộng tiền vào ví + ghi giao dịch. Gọi bên trong transaction. */
  async credit(
    tx: Prisma.TransactionClient,
    walletId: string,
    shopId: string,
    amount: number,
    type: 'deposit' | 'refund' | 'adjustment',
    opts: { orderId?: string; note?: string; createdBy?: string } = {},
  ) {
    if (amount <= 0) throw new BadRequestException('Credit amount must be positive');
    const updated = await tx.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId,
        shopId,
        type,
        amount,
        balanceAfter: updated.balance,
        orderId: opts.orderId,
        note: opts.note,
        createdBy: opts.createdBy ?? 'system',
      },
    });
    return updated;
  }

  /** Trừ tiền ví (kiểm tra đủ số dư, an toàn với concurrent request). Gọi bên trong transaction. */
  async debit(
    tx: Prisma.TransactionClient,
    walletId: string,
    shopId: string,
    amount: number,
    type: 'payment' | 'adjustment',
    opts: { orderId?: string; note?: string; createdBy?: string } = {},
  ) {
    if (amount <= 0) throw new BadRequestException('Debit amount must be positive');
    const res = await tx.wallet.updateMany({
      where: { id: walletId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (res.count === 0) throw new BadRequestException('Insufficient wallet balance');

    const updated = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
    await tx.walletTransaction.create({
      data: {
        walletId,
        shopId,
        type,
        amount: -amount,
        balanceAfter: updated.balance,
        orderId: opts.orderId,
        note: opts.note,
        createdBy: opts.createdBy ?? 'system',
      },
    });
    return updated;
  }

  // ==========================================
  // Buyer endpoints
  // ==========================================

  async getMyWallet(customerId: string) {
    const shopId = this.getShopId();
    const wallet = await this.getOrCreate(customerId, shopId);
    const pendingTopups = await this.prisma.walletTopupRequest.findMany({
      where: { walletId: wallet.id, status: 'pending', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      // KHÔNG select token — đây là capability, không lộ ra client.
      select: { id: true, amount: true, status: true, expiresAt: true, createdAt: true },
    });
    return { ...wallet, pendingTopups };
  }

  async getMyTransactions(customerId: string, page = 1, limit = 20) {
    const shopId = this.getShopId();
    const wallet = await this.getOrCreate(customerId, shopId);

    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async requestTopup(customerId: string, dto: TopupRequestDto) {
    const shopId = this.getShopId();

    // App không có global ValidationPipe → @Min(1000) trên DTO không chạy. Validate tay,
    // đồng thời chặn NaN/Infinity mà decorator-less path cho lọt qua.
    const amount = dto?.amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1000) {
      throw new BadRequestException('Số tiền nạp tối thiểu là 1.000đ');
    }

    const wallet = await this.getOrCreate(customerId, shopId);

    // token được lưu để định danh duy nhất nhưng KHÔNG bao giờ trả về cho người mua:
    // nó là capability, và việc xác nhận đã nhận tiền là hành động của merchant
    // (chỉ thực hiện qua route admin có guard). Người mua giữ token sẽ không tự credit được.
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const topup = await this.prisma.walletTopupRequest.create({
      data: { walletId: wallet.id, shopId, customerId, amount, token, expiresAt },
    });

    const bankAccount = await this.prisma.shopBankAccount.findUnique({ where: { shopId } });

    // Loại token khỏi response — không lộ capability ra client.
    const { token: _token, ...safeTopup } = topup;
    return { ...safeTopup, bankAccount };
  }

  // ==========================================
  // Resolve topup (chỉ gọi từ route admin có guard ADMIN/OWNER + scope theo shop)
  // ==========================================

  private async resolveTopup(id: string, shopId: string, action: 'confirm' | 'reject', createdBy: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // updateMany có điều kiện status=pending để chống double-confirm
      const res = await tx.walletTopupRequest.updateMany({
        where: { id, status: 'pending', expiresAt: { gt: new Date() } },
        data: { status: action === 'confirm' ? 'confirmed' : 'rejected', resolvedAt: new Date() },
      });
      if (res.count === 0) {
        throw new BadRequestException('Topup request expired or already resolved');
      }

      const topup = await tx.walletTopupRequest.findUniqueOrThrow({ where: { id } });

      if (action === 'confirm') {
        await this.credit(tx, topup.walletId, shopId, topup.amount, 'deposit', {
          note: `Nạp tiền vào ví (topup ${topup.id.substring(0, 8)})`,
          createdBy,
        });
      }

      return topup;
    });

    this.notificationsGateway.notifyUser(
      shopId,
      result.customerId,
      'CUSTOMER',
      action === 'confirm' ? 'WALLET_TOPUP_CONFIRMED' : 'WALLET_TOPUP_REJECTED',
      action === 'confirm' ? 'Topup Confirmed' : 'Topup Rejected',
      action === 'confirm'
        ? `Your wallet has been credited ${result.amount.toLocaleString('vi-VN')}đ.`
        : `Your topup request of ${result.amount.toLocaleString('vi-VN')}đ was rejected.`,
      { topupId: result.id },
    ).catch(err => console.error('Notification error', err));

    return { success: true, action, topupId: result.id };
  }

  // ==========================================
  // Admin endpoints
  // ==========================================

  async listWallets(query: { search?: string; page?: number; limit?: number }) {
    const shopId = this.getShopId();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const where: any = { shopId };
    if (query.search) {
      where.customer = {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { name: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.wallet.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { customer: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.wallet.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getWalletTransactionsAdmin(walletId: string, page = 1, limit = 20) {
    const shopId = this.getShopId();
    const wallet = await this.prisma.wallet.findFirst({ where: { id: walletId, shopId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { walletId } }),
    ]);

    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async adjust(dto: AdjustWalletDto) {
    const shopId = this.getShopId();
    if (!dto.amount || dto.amount === 0) throw new BadRequestException('Amount must be non-zero');

    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, shopId } });
    if (!customer) throw new NotFoundException('Customer not found in this shop');

    const updated = await this.prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreate(dto.customerId, shopId, tx);
      if (dto.amount > 0) {
        return this.credit(tx, wallet.id, shopId, dto.amount, 'adjustment', {
          note: dto.note || 'Điều chỉnh số dư bởi quản trị viên',
          createdBy: 'admin',
        });
      }
      return this.debit(tx, wallet.id, shopId, Math.abs(dto.amount), 'adjustment', {
        note: dto.note || 'Điều chỉnh số dư bởi quản trị viên',
        createdBy: 'admin',
      });
    });

    this.notificationsGateway.notifyUser(
      shopId,
      dto.customerId,
      'CUSTOMER',
      'WALLET_ADJUSTED',
      'Wallet Balance Updated',
      `Your wallet balance was ${dto.amount > 0 ? 'credited' : 'debited'} ${Math.abs(dto.amount).toLocaleString('vi-VN')}đ by the shop.`,
      { walletId: updated.id },
    ).catch(err => console.error('Notification error', err));

    return updated;
  }

  async listTopups(status?: string) {
    const shopId = this.getShopId();
    const where: any = { shopId };
    if (status) where.status = status;

    const items = await this.prisma.walletTopupRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Đính kèm thông tin khách để admin đối soát chuyển khoản
    const customerIds = [...new Set(items.map(t => t.customerId))];
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true },
    });
    const customerById = new Map(customers.map(c => [c.id, c]));

    return { data: items.map(t => ({ ...t, customer: customerById.get(t.customerId) || null })) };
  }

  async resolveTopupById(id: string, action: 'confirm' | 'reject') {
    const shopId = this.getShopId();
    const topup = await this.prisma.walletTopupRequest.findFirst({ where: { id, shopId } });
    if (!topup) throw new NotFoundException('Topup request not found');
    return this.resolveTopup(topup.id, shopId, action, 'admin');
  }

  /** Bật/tắt phương thức thanh toán bằng ví cho shop */
  async toggleWalletPaymentMethod(active: boolean) {
    const shopId = this.getShopId();
    return this.prisma.paymentMethod.upsert({
      where: { shopId_type: { shopId, type: WALLET_PAYMENT_TYPE } },
      update: { active },
      create: {
        shopId,
        type: WALLET_PAYMENT_TYPE,
        name: 'Ví cửa hàng',
        description: 'Thanh toán bằng số dư ví',
        active,
      },
    });
  }

  async getWalletPaymentMethod() {
    const shopId = this.getShopId();
    const method = await this.prisma.paymentMethod.findUnique({
      where: { shopId_type: { shopId, type: WALLET_PAYMENT_TYPE } },
    });
    return { data: method };
  }
}
