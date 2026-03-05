import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@ecommerce/database';

@Injectable()
export class ProductService {

    // Lấy ra danh sách sản phẩm hiển thị chung theo Shop (Ví dụ trang /catalog)
    async getProductsByShop(shopId: string, limit: number = 20, lastId?: string) {
        const query: any = { shopId, status: 'ACTIVE' };

        // Cursor-based Pagination logic placeholder cho performance cao hơn Offset/Limit
        if (lastId) {
            query._id = { $gt: lastId };
        }

        // Optimization: Lean Query (Mongoose trả về Vanilla Object thay vì Hydrated Document)
        // Tốc độ nhanh hơn 5x. 
        // Optimization: Projection, chỉ lấy vài field cơ bản để render thẻ Card sản phẩm
        const products = await Product.find(
            query,
            { title: 1, name: 1, images: 1, basePrice: 1, category: 1, "variants.stock": 1 }
        )
            .limit(limit)
            .lean();

        return products;
    }

    // Lấy chính xác nguyên bộ cấu hình sản phẩm để hiển thị chi tiết (Trang chi tiết /products/:id)
    async getProductDetails(productId: string) {
        // Không dùng Lean ở đây nếu cần thực thi các Mongoose methods sau này 
        // Tuy nhiên hiện tại read-only nên vẫn dùng lean() để tăng tốc response API
        const product = await Product.findById(productId).lean();
        if (!product) {
            throw new NotFoundException('Product not found or unavailable');
        }
        return product;
    }

    // Admin hoặc Hệ thống thêm sản phẩm mới
    async createProduct(shopId: string, productData: any) {
        const newProduct = new Product({
            shopId,
            ...productData,
            status: 'ACTIVE'
        });
        return newProduct.save();
    }
}
