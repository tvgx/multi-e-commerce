import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('api/products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    @Get('shop/:shopId')
    getShopProducts(
        @Param('shopId') shopId: string,
        @Query('limit') limit: number,
        @Query('lastId') lastId: string,
    ) {
        return this.productService.getProductsByShop(shopId, limit ? Number(limit) : 20, lastId);
    }

    @Get(':id')
    getProductDetail(@Param('id') id: string) {
        return this.productService.getProductDetails(id);
    }
}
