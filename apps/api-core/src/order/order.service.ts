import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<BaseResponseDto<any>> {
    try {
      // 1. Transaction to ensure atomicity
      return await this.prisma.$transaction(async (tx: any) => {
        // 0. Find or create Customer
        let customer = await tx.customer.findUnique({
          where: {
            shopId_email: {
              shopId: dto.shopId,
              email: dto.customerEmail,
            },
          },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              shopId: dto.shopId,
              email: dto.customerEmail,
              name: dto.customerName,
            },
          });
        }

        let totalAmount = 0;
        const lineItemsData = [];

        for (const item of dto.items) {
          // Get Product and its Master Variant
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              variants: {
                where: { isMaster: true },
                include: {
                  stockItems: {
                    include: { stockLocation: true },
                  },
                },
              },
            },
          });

          if (!product || product.shopId !== dto.shopId) {
            throw new CustomException(
              ResponseCodes.PRODUCT_NOT_EXISTED,
              'Product is not existed',
              HttpStatus.NOT_FOUND,
            );
          }

          const masterVariant = product.variants[0];
          if (!masterVariant) {
            throw new CustomException(
              ResponseCodes.PRODUCT_NOT_EXISTED,
              'Master variant not found',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }

          const totalStock = masterVariant.stockItems.reduce(
            (acc: any, si: any) => acc + si.countOnHand,
            0,
          );
          if (totalStock < item.quantity) {
            throw new CustomException(
              ResponseCodes.PRODUCT_SOLD,
              'The product has been sold or is out of stock.',
              HttpStatus.BAD_REQUEST,
            );
          }

          // Reduce stock (simple: take from default location or first location)
          const defaultStockItem =
            masterVariant.stockItems.find(
              (si: any) => si.stockLocation.isDefault,
            ) || masterVariant.stockItems[0];

          await tx.stockItem.update({
            where: { id: defaultStockItem.id },
            data: { countOnHand: { decrement: item.quantity } },
          });

          const priceAtBuy = masterVariant.price;
          totalAmount += priceAtBuy * item.quantity;

          lineItemsData.push({
            variantId: masterVariant.id,
            quantity: item.quantity,
            price: priceAtBuy,
          });
        }

        // 2. Create Order
        const order = await tx.order.create({
          data: {
            number: `R${Date.now()}`, // Generate a public order number
            shopId: dto.shopId,
            customerId: customer.id,
            totalAmount,
            itemTotal: totalAmount,
            state: 'confirm', // cart, address, delivery, payment, confirm, complete, canceled
            lineItems: {
              create: lineItemsData,
            },
          },
          include: { lineItems: true },
        });

        // 3. Process Payment
        let paymentMethod = await tx.paymentMethod.findFirst({
          where: { shopId: dto.shopId, type: dto.paymentProvider },
        });
        if (!paymentMethod) {
          paymentMethod = await tx.paymentMethod.create({
            data: {
              shopId: dto.shopId,
              name: dto.paymentProvider,
              type: dto.paymentProvider,
              active: true,
            },
          });
        }

        const paymentIntent = await this.paymentService.processPayment(
          dto.paymentProvider,
          totalAmount,
          'VND',
          order.id,
        );

        await tx.payment.create({
          data: {
            orderId: order.id,
            paymentMethodId: paymentMethod.id,
            amount: totalAmount,
            state:
              paymentIntent.status === 'SUCCEEDED' ? 'completed' : 'processing',
            responseCode: paymentIntent.transactionId,
          },
        });

        if (paymentIntent.status === 'SUCCEEDED') {
          await tx.order.update({
            where: { id: order.id },
            data: { paymentState: 'paid' },
          });
        }

        // Refetch order with payments
        const finalOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { lineItems: true, payments: true },
        });

        return BaseResponseDto.success(finalOrder);
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Exception error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOrder(orderId: string): Promise<BaseResponseDto<any>> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lineItems: true, shop: true },
    });
    if (!order)
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'No Data',
        HttpStatus.NOT_FOUND,
      );
    return BaseResponseDto.success(order);
  }

  async getOrdersByCustomerEmail(
    shopId: string,
    email: string,
  ): Promise<BaseResponseDto<any>> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        shopId_email: { shopId, email },
      },
    });

    if (!customer) {
      return BaseResponseDto.success([]);
    }

    const orders = await this.prisma.order.findMany({
      where: { shopId, customerId: customer.id },
      include: {
        lineItems: { include: { variant: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return BaseResponseDto.success(orders);
  }

  async getOrdersByShop(shopId: string): Promise<BaseResponseDto<any>> {
    const orders = await this.prisma.order.findMany({
      where: { shopId },
      include: {
        lineItems: { include: { variant: { include: { product: true } } } },
        customer: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return BaseResponseDto.success(orders);
  }

  async updateOrderState(
    orderId: string,
    state: string,
  ): Promise<BaseResponseDto<any>> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { state },
    });
    return BaseResponseDto.success(order);
  }
}
