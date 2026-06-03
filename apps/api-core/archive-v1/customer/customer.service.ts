import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  SubscribeDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerProfileUpdateDto,
  GetCustomersQueryDto,
} from './dto/customer.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiểm tra quyền sở hữu Shop của Owner.
   */
  private async checkShopOwner(ownerId: string, shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, ownerId },
    });
    if (!shop) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'You do not have access to this shop.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async subscribe(dto: SubscribeDto): Promise<BaseResponseDto<any>> {
    try {
      const existing = await this.prisma.customer.findUnique({
        where: {
          shopId_email: {
            shopId: dto.shopId,
            email: dto.email,
          },
        },
      });

      if (existing) {
        throw new CustomException(
          ResponseCodes.ACTION_DONE_PREVIOUSLY,
          'action has been done previously by this user.',
          HttpStatus.CONFLICT,
        );
      }

      const customer = await this.prisma.customer.create({
        data: {
          shopId: dto.shopId,
          email: dto.email,
          name: dto.name,
        },
      });

      return BaseResponseDto.success(customer);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Exception error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // SHOP OWNER CRUD LOGIC
  // ==========================================

  async getCustomers(
    ownerId: string,
    query: GetCustomersQueryDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkShopOwner(ownerId, query.shopId);

      const whereClause: any = {
        shopId: query.shopId,
      };

      if (query.email) {
        whereClause.email = { contains: query.email, mode: 'insensitive' };
      }
      if (query.name) {
        whereClause.name = { contains: query.name, mode: 'insensitive' };
      }
      if (query.phoneNumber) {
        whereClause.phoneNumber = {
          contains: query.phoneNumber,
          mode: 'insensitive',
        };
      }

      const [items, total] = await Promise.all([
        this.prisma.customer.findMany({
          where: whereClause,
          take: query.limit,
          skip: query.offset,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.customer.count({
          where: whereClause,
        }),
      ]);

      return BaseResponseDto.success({ items, total });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to get customers.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomerDetail(
    ownerId: string,
    shopId: string,
    customerId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkShopOwner(ownerId, shopId);

      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, shopId },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!customer) {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Customer not found in this shop.',
          HttpStatus.NOT_FOUND,
        );
      }

      return BaseResponseDto.success(customer);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to get customer detail.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createCustomer(
    ownerId: string,
    dto: CreateCustomerDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkShopOwner(ownerId, dto.shopId);

      const existing = await this.prisma.customer.findUnique({
        where: {
          shopId_email: {
            shopId: dto.shopId,
            email: dto.email,
          },
        },
      });

      if (existing) {
        throw new CustomException(
          ResponseCodes.USER_EXISTED,
          'Customer with this email already exists in this shop.',
          HttpStatus.CONFLICT,
        );
      }

      const customer = await this.prisma.customer.create({
        data: {
          shopId: dto.shopId,
          email: dto.email,
          name: dto.name,
          phoneNumber: dto.phoneNumber,
          image: dto.image,
        },
      });

      return BaseResponseDto.success(customer);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to create customer.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCustomer(
    ownerId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkShopOwner(ownerId, dto.shopId);

      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, shopId: dto.shopId },
      });

      if (!customer) {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Customer not found in this shop.',
          HttpStatus.NOT_FOUND,
        );
      }

      const updated = await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          name: dto.name,
          phoneNumber: dto.phoneNumber,
          image: dto.image,
        },
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to update customer.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteCustomer(
    ownerId: string,
    shopId: string,
    customerId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkShopOwner(ownerId, shopId);

      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, shopId },
      });

      if (!customer) {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Customer not found in this shop.',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.customer.delete({
        where: { id: customerId },
      });

      return BaseResponseDto.success({ deleted: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to delete customer.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // STOREFRONT CUSTOMER PERSONAL LOGIC
  // ==========================================

  async getCustomerProfile(
    customerId: string,
    shopId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, shopId },
      });

      if (!customer) {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Customer profile not found.',
          HttpStatus.NOT_FOUND,
        );
      }

      return BaseResponseDto.success(customer);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to get profile.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCustomerProfile(
    customerId: string,
    shopId: string,
    dto: CustomerProfileUpdateDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, shopId },
      });

      if (!customer) {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Customer profile not found.',
          HttpStatus.NOT_FOUND,
        );
      }

      const updated = await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          name: dto.name,
          phoneNumber: dto.phoneNumber,
          image: dto.image,
        },
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to update profile.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomerOrders(
    customerId: string,
    shopId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<BaseResponseDto<any>> {
    try {
      const [items, total] = await Promise.all([
        this.prisma.order.findMany({
          where: { customerId, shopId },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.count({
          where: { customerId, shopId },
        }),
      ]);

      return BaseResponseDto.success({ items, total });
    } catch (error) {
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to get orders.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomerOrderDetail(
    customerId: string,
    shopId: string,
    orderId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, customerId, shopId },
        include: {
          lineItems: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Order not found.',
          HttpStatus.NOT_FOUND,
        );
      }

      return BaseResponseDto.success(order);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to get order detail.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

