import { Injectable, HttpStatus, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { PaymentService } from '../payment/payment.service';
import { PromotionService } from '../promotion/promotion.service';
import { TaxService } from '../tax/tax.service';
import { ShippingService } from '../shipping/shipping.service';

const VALID_TRANSITIONS: Record<string, string[]> = {
  cart: ['address', 'canceled'],
  address: ['delivery', 'canceled'],
  delivery: ['payment', 'canceled'],
  payment: ['confirm', 'canceled'],
  confirm: ['complete', 'canceled'],
  complete: [], // Terminal
  canceled: [], // Terminal
};

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => PromotionService))
    private readonly promotionService: PromotionService,
    private readonly taxService: TaxService,
    private readonly shippingService: ShippingService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<BaseResponseDto<any>> {
    try {
      // 1. Transaction to ensure atomicity for order creation and stock decrement
      const { order, customer, paymentMethod } = await this.prisma.$transaction(
        async (tx: any) => {
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

          let itemTotal = 0;
          let totalWeight = 0;
          const lineItemsData = [];

          // Fix N+1: Fetch all products at once
          const productIds = dto.items.map((item) => item.productId);
          const products = await tx.product.findMany({
            where: { id: { in: productIds }, shopId: dto.shopId },
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

          const productMap = new Map<string, any>(
            products.map((p: any) => [p.id, p]),
          );

          for (const item of dto.items) {
            const product = productMap.get(item.productId);

            if (!product) {
              throw new CustomException(
                ResponseCodes.PRODUCT_NOT_EXISTED,
                `Product ${item.productId} not found in this shop`,
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

            // Atomic Stock Update with condition
            const defaultStockItem =
              masterVariant.stockItems.find(
                (si: any) => si.stockLocation.isDefault,
              ) || masterVariant.stockItems[0];

            try {
              await tx.stockItem.update({
                where: {
                  id: defaultStockItem.id,
                  countOnHand: { gte: item.quantity }, // Ensure sufficient stock atomically
                },
                data: { countOnHand: { decrement: item.quantity } },
              });
            } catch (e) {
              throw new CustomException(
                ResponseCodes.PRODUCT_SOLD,
                `Product ${product.name} is out of stock or insufficient.`,
                HttpStatus.BAD_REQUEST,
              );
            }

            const priceAtBuy = masterVariant.price;
            const weight = masterVariant.weight || 0;
            
            totalWeight += weight * item.quantity;
            itemTotal += priceAtBuy * item.quantity;

            lineItemsData.push({
              variantId: masterVariant.id,
              quantity: item.quantity,
              price: priceAtBuy,
            });
          }

          let promoTotal = 0;
          let promotionId = null;

          if (dto.promoCode) {
            const promoResult = await this.promotionService.validatePromotion(
              dto.shopId,
              dto.promoCode,
              itemTotal,
              tx,
            );
            promoTotal = promoResult.discountAmount;
            promotionId = promoResult.promotionId;

            // Increment used count atomically inside the transaction
            await tx.promotion.update({
              where: { id: promotionId },
              data: {
                usedCount: { increment: 1 },
              },
            });
          }

          // Compute Tax & Shipping
          const taxRes = await this.taxService.calculateTax(itemTotal, dto.shopId);
          const taxTotal = taxRes.taxTotal;
          const taxIncluded = taxRes.taxIncluded;

          const shipmentTotal = await this.shippingService.calculateShipping(
            totalWeight,
            dto.shippingMethodId || 'standard',
            dto.shopId,
          );

          // Allocated Tax to each line item based on price ratio
          const allocatedLineItems = lineItemsData.map((item) => {
            const itemValue = item.price * item.quantity;
            const allocatedTax = itemTotal > 0 ? (taxTotal * itemValue) / itemTotal : 0;
            return {
              ...item,
              taxTotal: Math.round(allocatedTax * 100) / 100,
            };
          });

          // Final Total Financial calculation
          const finalTotal = itemTotal - promoTotal;
          const totalAmount = finalTotal + shipmentTotal + (taxIncluded ? 0 : taxTotal);

          // 2. Create Order (Initially in 'confirm' or 'pending' state)
          const order = await tx.order.create({
            data: {
              number: `R${Date.now()}`,
              shopId: dto.shopId,
              customerId: customer.id,
              totalAmount: totalAmount,
              itemTotal: itemTotal,
              promoTotal: promoTotal,
              taxTotal: taxTotal,
              shipmentTotal: shipmentTotal,
              state: 'confirm',
              lineItems: {
                create: allocatedLineItems,
              },
            },
            include: { lineItems: true },
          });

          // 3. Prepare Payment Method
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

          return { order, customer, paymentMethod };
        },
        {
          timeout: 10000, // 10s timeout for safety
        },
      );

      // 4. Process Payment (OUTSIDE Transaction to avoid connection pooling issues)
      const paymentIntent = await this.paymentService.processPayment(
        dto.paymentProvider,
        order.totalAmount,
        'VND',
        order.id,
      );

      // 5. Update results in a second transaction
      const finalOrder = await this.prisma.$transaction(async (tx: any) => {
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            paymentMethodId: paymentMethod.id,
            amount: order.totalAmount,
            state:
              paymentIntent.status === 'SUCCEEDED' ? 'completed' : 'processing',
            responseCode: paymentIntent.transactionId,
          },
        });

        return tx.order.update({
          where: { id: order.id },
          data: {
            paymentState:
              paymentIntent.status === 'SUCCEEDED' ? 'paid' : 'balance_due',
          },
          include: { lineItems: true, payments: true },
        });
      });

      return BaseResponseDto.success({
        ...finalOrder,
        paymentIntent,
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

  async getOrdersByShop(
    shopId: string,
    limit: number = 20,
    offset: number = 0,
    ownerId?: string,
  ): Promise<BaseResponseDto<any>> {
    if (ownerId) {
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop || shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Unauthorized to view orders for this shop',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const orders = await this.prisma.order.findMany({
      where: { shopId },
      include: {
        lineItems: {
          include: { variant: { include: { product: true } } },
          take: 10, // Limit nested items for listing
        },
        customer: true,
        payments: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
    return BaseResponseDto.success(orders);
  }

  private validateStateTransition(currentState: string, targetState: string): void {
    const allowed = VALID_TRANSITIONS[currentState];
    if (!allowed || !allowed.includes(targetState)) {
      throw new BadRequestException(
        `Invalid order state transition from "${currentState}" to "${targetState}"`,
      );
    }
  }

  async updateOrderState(
    orderId: string,
    targetState: string,
    ownerId?: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      // 1. Fetch current order with relations
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          lineItems: true,
          shop: true,
        },
      });

      if (!order) {
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'Order not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // 2. Multi-tenant Shop Owner Verification
      if (ownerId && order.shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Unauthorized to manage this order',
          HttpStatus.FORBIDDEN,
        );
      }

      // 3. State Transition Validation
      this.validateStateTransition(order.state, targetState);

      // 4. State Modification within Transaction for atomic safety
      const updatedOrder = await this.prisma.$transaction(async (tx: any) => {
        // Handle stock restoration on cancellation
        if (targetState === 'canceled') {
          // Only restore stock if the order had reached 'confirm' or 'payment' state where stock was decremented
          const stockDecrementedStates = ['confirm', 'payment'];
          if (stockDecrementedStates.includes(order.state)) {
            for (const item of order.lineItems) {
              // Find default stock location for the variant
              const defaultStockLocation = await tx.stockLocation.findFirst({
                where: { shopId: order.shopId, isDefault: true },
              });

              const stockLocationId = defaultStockLocation
                ? defaultStockLocation.id
                : (await tx.stockLocation.findFirst({ where: { shopId: order.shopId } }))?.id;

              if (stockLocationId) {
                // Find or create StockItem
                const stockItem = await tx.stockItem.findUnique({
                  where: {
                    stockLocationId_variantId: {
                      stockLocationId,
                      variantId: item.variantId,
                    },
                  },
                });

                if (stockItem) {
                  await tx.stockItem.update({
                    where: { id: stockItem.id },
                    data: {
                      countOnHand: { increment: item.quantity },
                    },
                  });
                }
              }
            }
          }

          // If order is paid, set paymentState to credit_owed
          const newPaymentState = order.paymentState === 'paid' ? 'credit_owed' : order.paymentState;

          return tx.order.update({
            where: { id: orderId },
            data: {
              state: targetState,
              paymentState: newPaymentState,
            },
            include: { lineItems: true, payments: true },
          });
        }

        // Standard state update for other transitions
        return tx.order.update({
          where: { id: orderId },
          data: { state: targetState },
          include: { lineItems: true, payments: true },
        });
      });

      return BaseResponseDto.success(updatedOrder);
    } catch (error) {
      if (error instanceof CustomException || error instanceof BadRequestException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to update order state',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
