import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../database/prisma.service';
import {
  ProductLayout,
  ProductDocument,
} from './schemas/product-layout.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    @InjectModel(ProductLayout.name)
    private productLayoutModel: Model<ProductDocument>,
  ) {}

  async createProduct(ownerId: string, dto: CreateProductDto): Promise<BaseResponseDto<any>> {
    try {
      // 1. Verify shop ownership
      const shop = await this.prisma.shop.findUnique({ where: { id: dto.shopId } });
      if (!shop) throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'Shop not found', HttpStatus.NOT_FOUND);
      if (shop.ownerId !== ownerId) {
        throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);
      }

      // 2. Policy check (Weight/Price) - although handled by class-validator, we do double check
      if (dto.basePrice > 30000000 || (dto.weight && dto.weight > 20)) {
        throw new CustomException(
          ResponseCodes.POLICY_VIOLATION,
          'Policy Violation, not support weight over 20KG & price over 30M',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. Create in Postgres
      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          basePrice: dto.basePrice,
          inStock: dto.inStock || 0,
          shopId: dto.shopId,
          status: 'PUBLISHED',
        },
      });

      // 4. Create in MongoDB
      const layout = new this.productLayoutModel({
        productId: product.id,
        shopId: dto.shopId,
        metadata: dto.extraMetadata || {},
        images: dto.images || [],
      });
      await layout.save();

      return BaseResponseDto.success(product);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Exception error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProductsByShop(shopId: string, limit: number = 20): Promise<BaseResponseDto<any>> {
    const products = await this.prisma.product.findMany({
      where: { shopId },
      take: limit,
    });
    
    if (products.length === 0) {
      throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'No Data or end of list data', HttpStatus.OK);
    }

    return BaseResponseDto.success(products);
  }

  async getProductDetails(productId: string): Promise<BaseResponseDto<any>> {
    const productPostgres = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productPostgres) {
      throw new CustomException(ResponseCodes.PRODUCT_NOT_EXISTED, 'Product is not existed', HttpStatus.NOT_FOUND);
    }

    const layoutDoc = await this.productLayoutModel
      .findOne({ productId })
      .lean();

    return BaseResponseDto.success({
      ...productPostgres,
      layout: layoutDoc,
    });
  }

  async updateProduct(ownerId: string, productId: string, dto: UpdateProductDto): Promise<BaseResponseDto<any>> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) throw new CustomException(ResponseCodes.PRODUCT_NOT_EXISTED, 'Product is not existed', HttpStatus.NOT_FOUND);
    if (product.shop.ownerId !== ownerId) throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);

    const updatedPostgres = await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        basePrice: dto.basePrice,
        inStock: dto.inStock,
      },
    });

    if (dto.extraMetadata) {
      await this.productLayoutModel.updateOne(
        { productId },
        { $set: { metadata: dto.extraMetadata } },
      );
    }

    return BaseResponseDto.success(updatedPostgres);
  }
}
