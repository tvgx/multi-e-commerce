import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto): Promise<BaseResponseDto<any>> {
    try {
      // 1. Transaction to ensure atomicity
      return await this.prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of dto.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || product.shopId !== dto.shopId) {
            throw new CustomException(ResponseCodes.PRODUCT_NOT_EXISTED, 'Product is not existed', HttpStatus.NOT_FOUND);
          }

          if (product.inStock < item.quantity) {
            throw new CustomException(ResponseCodes.PRODUCT_SOLD, 'The product has been sold.', HttpStatus.BAD_REQUEST);
          }

          // Reduce stock
          await tx.product.update({
            where: { id: item.productId },
            data: { inStock: { decrement: item.quantity } },
          });

          totalAmount += product.basePrice * item.quantity;
          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            priceAtBuy: product.basePrice,
          });
        }

        // 2. Create Order
        const order = await tx.order.create({
          data: {
            shopId: dto.shopId,
            customerId: dto.customerId,
            totalAmount,
            status: 'PENDING',
            items: {
              create: orderItemsData,
            },
          },
          include: { items: true },
        });

        return BaseResponseDto.success(order);
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Exception error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getOrder(orderId: string): Promise<BaseResponseDto<any>> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shop: true },
    });
    if (!order) throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'No Data', HttpStatus.NOT_FOUND);
    return BaseResponseDto.success(order);
  }
}
