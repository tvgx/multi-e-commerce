const { PrismaClient } = require('@ecommerce/database');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const dotenv = require('dotenv');
const { join } = require('path');

// Load root .env
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGO_DB_ATLAS || process.env.MONGODB_URI;

// Khởi tạo Prisma (dùng DATABASE_URL từ process.env)
const prisma = new PrismaClient();

// Thiết lập Schema thủ công cho Script
const ProductLayoutSchema = new Schema({
  productId: { type: String, required: true },
  shopId: { type: String, required: true },
  descriptionHtml: { type: String, default: '' },
  imageUrls: { type: [String], default: [] },
  videoUrls: { type: [String], default: [] },
  attributes: { type: Object, default: {} },
  seoData: { type: Object, default: {} },
  customLandingPageLayout: { type: Object, default: {} }
}, { timestamps: true, collection: 'products' });

const ProductLayout = mongoose.models.ProductLayout || mongoose.model('ProductLayout', ProductLayoutSchema);

async function main() {
  console.log('--- BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU ---');

  // 1. Kết nối MongoDB
  console.log('\n[MongoDB] Đang kết nối tới Atlas...');
  if (!MONGODB_URI) throw new Error('Không tìm thấy MONGODB_URI trong file .env');
  
  await mongoose.connect(MONGODB_URI);
  console.log('[MongoDB] ✅ Kết nối thành công!');

  // 2. Clear dữ liệu cũ (Tùy chọn)
  console.log('\n🗑️ Đang dọn dẹp dữ liệu cũ (Tùy chọn)...');
  await ProductLayout.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.shop.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Dọn dẹp hoàn tất!');

  // 3. Tạo Dữ liệu ở PostgreSQL (Users, Shops, Products)
  console.log('\n[PostgreSQL] Đang tạo dữ liệu cấu trúc (Structured Data)...');
  
  // 3.1 Tạo User (Chủ shop)
  const user = await prisma.user.create({
    data: {
      email: 'test-shop-owner@example.com',
      passwordHash: 'hashed_password_123',
      fullName: 'Nguyễn Văn Chủ Shop',
      role: 'OWNER',
    }
  });

  // 3.2 Tạo Shop
  const shop = await prisma.shop.create({
    data: {
      ownerId: user.id,
      name: 'Sneaker Head Store',
      domain: 'sneaker-head.demo.com',
      status: 'PUBLISHED'
    }
  });

  // 3.3 Tạo Product trong Postgres
  const productA = await prisma.product.create({
    data: {
      shopId: shop.id,
      name: 'Giày Thể Thao Nike Air Max 270',
      slug: 'giay-the-thao-nike-air-max-270-seed',
      basePrice: 2500000,
      currency: 'VND',
      inStock: 50,
      sku: 'NIKE-AM270-BLK',
      categoryId: 'sneakers',
      brand: 'Nike',
      status: 'PUBLISHED'
    }
  });

  const productB = await prisma.product.create({
    data: {
      shopId: shop.id,
      name: 'Áo Thun Cotton Form Rộng Basic',
      slug: 'ao-thun-cotton-form-rong-basic-seed',
      basePrice: 199000,
      currency: 'VND',
      inStock: 200,
      sku: 'TSHIRT-CTN-WHT',
      categoryId: 'clothing',
      status: 'PUBLISHED'
    }
  });

  console.log(`[PostgreSQL] ✅ Đã tạo 1 Shop và 2 Sản phẩm (IDs: ${productA.id}, ${productB.id})`);

  // 4. Tạo Dữ liệu ở MongoDB (Unstructured Data / Layout)
  console.log('\n[MongoDB] Đang đồng bộ dữ liệu giao diện sang MongoDB...');
  
  await ProductLayout.create([
    {
      productId: productA.id,
      shopId: shop.id,
      descriptionHtml: '<h2>Nike Air Max 270</h2><p>Mẫu giày huyền thoại với đệm khí êm ái, mang lại cảm giác thoải mái tối đa cho cả ngày dài vận động.</p>',
      imageUrls: [
        'https://example.com/images/nike-1.jpg',
        'https://example.com/images/nike-2.jpg'
      ],
      attributes: {
        'Color': ['Black', 'White/Red'],
        'Size': ['40', '41', '42', '43'],
        'Material': 'Mesh upper, Rubber sole'
      },
      seoData: {
        metaTitle: 'Mua Giày Nike Air Max 270 Đen Chính Hãng',
        metaDescription: 'Sản phẩm giày Nike Air Max cực xịn dành cho giới trẻ.',
        keywords: ['giày thể thao', 'nike chính hãng', 'air max']
      }
    },
    {
      productId: productB.id,
      shopId: shop.id,
      descriptionHtml: '<h3>Áo Thun Trơn Basic</h3><p>Mẫu áo thun dễ phối đồ nhất, phù hợp với mọi phong cách. Chất vải 100% cotton thoáng mát.</p>',
      imageUrls: [
        'https://example.com/images/tshirt-white.jpg'
      ],
      attributes: {
        'Color': ['White', 'Black', 'Grey'],
        'Size': ['S', 'M', 'L', 'XL'],
        'Fit': 'Oversized'
      }
      // Không truyền seoData để test trường hợp dữ liệu mềm dẻo không đồng nhất
    }
  ]);

  console.log('[MongoDB] ✅ Đã lưu 2 Document cấu hình Product Layout!');

  // 5. Query thử nghiệm để chứng minh Join logic
  console.log('\n--- KẾT QUẢ TRUY VẤN THỬ NGHIỆM JOIN ---');
  
  // Lấy ra từ Postgres
  const testProduct = await prisma.product.findUnique({ where: { id: productA.id } });
  
  // Lấy ra từ MongoDB
  const testLayout = await ProductLayout.findOne({ productId: productA.id }).lean();

  console.log('\n[Hybrid Data Result]:', JSON.stringify({
    // Gộp dữ liệu hiển thị (Giống hệt cách Backend NestJS sẽ làm)
    id: testProduct.id,
    name: testProduct.name,
    price: testProduct.basePrice,
    stock: testProduct.inStock,
    images: testLayout.imageUrls,           // Lấy từ Mongo
    variants: testLayout.attributes,        // Lấy từ Mongo
    description: testLayout.descriptionHtml // Lấy từ Mongo
  }, null, 2));

  console.log('\n--- QUÁ TRÌNH HOÀN TẤT ---');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi xảy ra:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Đóng toàn bộ connection
    await prisma.$disconnect();
    await mongoose.disconnect();
    console.log('\nĐã ngắt kết nối các Database.');
  });
