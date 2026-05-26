import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import * as Minio from 'minio';
import fs from 'fs';
import path from 'path';

// Import Mongoose Models (Re-defined here to avoid complex monorepo imports in single script)
const ShopTemplateSchema = new mongoose.Schema({
    shopId: { type: String, required: true, unique: true, index: true },
    publishedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    draftData: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const ProductLayoutSchema = new mongoose.Schema({
    productId: { type: String, required: true, index: true },
    shopId: { type: String, required: true, index: true },
    descriptionHtml: { type: String, default: '' },
    imageUrls: [{ type: String }],
    videoUrls: [{ type: String }],
    attributes: { type: Object, default: {} },
    seoData: { type: Object, default: {} },
}, { timestamps: true, collection: 'products' });

const ShopTemplate = mongoose.models.ShopTemplate || mongoose.model('ShopTemplate', ShopTemplateSchema);
const ProductLayout = mongoose.models.ProductLayout || mongoose.model('ProductLayout', ProductLayoutSchema, 'products');

const prisma = new PrismaClient();

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
});

const LAYOUT_BUCKET = 'shop-layouts';

const PRODUCTS = [
    {
        name: "Oversized 'Vibe' T-Shirt",
        slug: "oversized-vibe-tshirt",
        description: "A premium cotton blend oversized t-shirt perfect for casual street style.",
        price: 350000,
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80"],
        category: "Tops",
    },
    {
        name: "Urban Utility Cargo Pants",
        slug: "urban-utility-cargo-pants",
        description: "Durable and stylish cargo pants with multiple utility pockets.",
        price: 550000,
        images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80"],
        category: "Bottoms",
    },
    {
        name: "Classic Denim Jacket",
        slug: "classic-denim-jacket",
        description: "A timeless classic denim jacket, slightly distressed for a vintage look.",
        price: 850000,
        images: ["https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80"],
        category: "Outerwear",
    },
    {
        name: "Minimalist Knit Hoodie",
        slug: "minimalist-knit-hoodie",
        description: "Soft knit hoodie, perfect for layering during transitional weather.",
        price: 650000,
        images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80"],
        category: "Outerwear",
    },
    {
        name: "Retro High-Top Sneakers",
        slug: "retro-high-top-sneakers",
        description: "Comfortable high-top sneakers with a throwback color block design.",
        price: 1200000,
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80"],
        category: "Shoes",
    },
    {
        name: "Summer Linen Dress",
        slug: "summer-linen-dress",
        description: "Breathable linen dress, elegant and airy for warm days.",
        price: 750000,
        images: ["https://images.unsplash.com/photo-1515347619152-16e53d508931?auto=format&fit=crop&q=80"],
        category: "Dresses",
    },
    {
        name: "Aviator Sunglasses",
        slug: "aviator-sunglasses",
        description: "Classic aviators with polarized lenses to protect your eyes with style.",
        price: 450000,
        images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80"],
        category: "Accessories",
    },
    {
        name: "Chunky Wool Beanie",
        slug: "chunky-wool-beanie",
        description: "Warm and cozy chunky knit beanie to top off your winter outfit.",
        price: 250000,
        images: ["https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80"],
        category: "Accessories",
    }
];

async function main() {
    console.log("🌱 Starting Genta Store Seeding Process...");
    
    // 1. Connect MongoDB
    if (!process.env.MONGO_DB_ATLAS) {
        throw new Error("MONGO_DB_ATLAS is missing in process.env");
    }
    await mongoose.connect(process.env.MONGO_DB_ATLAS, { family: 4 });
    console.log("✅ MongoDB Connected");

    // 2. Ensure MinIO Bucket
    const exists = await minioClient.bucketExists(LAYOUT_BUCKET);
    if (!exists) {
        await minioClient.makeBucket(LAYOUT_BUCKET, 'us-east-1');
        console.log(`✅ MinIO Bucket '${LAYOUT_BUCKET}' Created`);
    } else {
        console.log(`✅ MinIO Bucket '${LAYOUT_BUCKET}' Checked`);
    }

    // 3. Clean up previous Genta Data (Postgres)
    console.log("🧹 Cleaning up old Genta data...");
    await prisma.shop.deleteMany({ where: { domain: "genta.ecommerce.local" } });
    await prisma.user.deleteMany({ where: { email: "admin@genta.com" } });
    
    // 4. Create User
    const user = await prisma.user.create({
        data: {
            email: "admin@genta.com",
            name: "Genta Admin",
            fullName: "Genta Store Administrator",
            role: "OWNER"
        }
    });
    console.log(`✅ Created User: ${user.email}`);

    // 5. Create Shop
    const shop = await prisma.shop.create({
        data: {
            ownerId: user.id,
            name: "Genta Apparel",
            domain: "genta.ecommerce.local",
            status: "PUBLISHED"
        }
    });
    console.log(`✅ Created Shop: ${shop.name} (${shop.domain})`);

    // 6. Create Stock Location
    const stockLocation = await prisma.stockLocation.create({
        data: {
            shopId: shop.id,
            name: "Genta Main Warehouse",
            isDefault: true
        }
    });

    // 7. Seed Products + MongoDB ProductLayouts
    console.log(`📦 Seeding ${PRODUCTS.length} detailed products...`);
    for (const p of PRODUCTS) {
        // Create Product
        const product = await prisma.product.create({
            data: {
                shopId: shop.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                status: "PUBLISHED",
                categoryId: p.category
            }
        });

        // Create Master Variant
        const variant = await prisma.variant.create({
            data: {
                productId: product.id,
                sku: `GENTA-${p.slug.toUpperCase().substring(0, 8)}`,
                price: p.price,
                isMaster: true
            }
        });

        // Create Stock Item
        await prisma.stockItem.create({
            data: {
                stockLocationId: stockLocation.id,
                variantId: variant.id,
                countOnHand: Math.floor(Math.random() * 50) + 10 // 10-60 stock
            }
        });

        // Create MongoDB Product Layout (Images, HTML)
        await ProductLayout.deleteMany({ productId: product.id });
        const pLayout = new ProductLayout({
            productId: product.id,
            shopId: shop.id,
            descriptionHtml: `<p><strong>${p.name}</strong> is designed to elevate your everyday wardrobe. Built with quality materials and styled for modern aesthetics.</p>`,
            imageUrls: p.images,
            attributes: { "Brand": "Genta", "Condition": "Brand New" }
        });
        await pLayout.save();
    }
    console.log("✅ Products Seeding Completed");

    // 8. Load and modify Master Template (fashion.json)
    console.log("🎨 Cooking Master Template for Genta...");
    const masterPath = path.join(__dirname, '../packages/master-templates/src/fashion.json');
    const templateContent = fs.readFileSync(masterPath, 'utf8');
    const masterTemplate = JSON.parse(templateContent);

    // Deep copy and modify
    const gentaLayout = {
        ...masterTemplate,
        shopId: shop.id,
        isMaster: false,
        baseLayoutId: "MASTER_FASHION",
        metadata: {
            ...masterTemplate.metadata,
            primaryColor: "#0ea5e9", // Sky Blue for Genta vibe
            fontFamily: "Inter",
        }
    };
    
    // Customize Hero Section to make it unique
    const homePages = gentaLayout.pages.home;
    const heroSection = homePages.find((comp: any) => comp.componentId === "Hero");
    if (heroSection) {
        heroSection.props = {
            title: "Tuyên Ngôn Phong Cách - Genta 2026",
            subtitle: "Khám phá bộ sưu tập thời trang đương đại, vượt thời gian.",
            imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80", 
            buttonText: "Shop Collection"
        };
    }

    const marqueeSection = gentaLayout.global.header.find((comp: any) => comp.componentId === "HeroMarquee");
    if (marqueeSection) {
        marqueeSection.props.text = "MIỄN PHÍ VẬN CHUYỂN TẤT CẢ ĐƠN HÀNG TRÊN 500,000Đ • BỘ SƯU TẬP XUÂN HÈ ĐÃ LÊN KỆ CÙNG GENTA";
    }

    // 9. Save Layout to Postgres Cache
    await prisma.mergedLayoutsCache.upsert({
        where: { shopId: shop.id },
        update: { layoutJson: gentaLayout },
        create: { shopId: shop.id, layoutJson: gentaLayout },
    });
    console.log("✅ Layout saved to PostgreSQL (MergedLayoutsCache)");

    // 10. Save Layout to MongoDB (ShopTemplate)
    await ShopTemplate.updateOne(
        { shopId: shop.id },
        { $set: { publishedData: gentaLayout, lastPublishedAt: new Date() } },
        { upsert: true }
    );
    console.log("✅ Layout saved to MongoDB (ShopTemplate)");

    // 11. Save Layout to MinIO (Traffic Control)
    const objectKey = `${shop.id}.json`;
    const buffer = Buffer.from(JSON.stringify(gentaLayout), 'utf-8');
    await minioClient.putObject(
        LAYOUT_BUCKET,
        objectKey,
        buffer,
        buffer.byteLength,
        { 'Content-Type': 'application/json' },
    );
    console.log(`✅ Layout pushed to MinIO Edge Storage -> ${LAYOUT_BUCKET}/${objectKey}`);

    console.log("\n🎉 Genta Store is ready! 🎉");
    console.log(`To view: Add to hosts file (if not using next-local): 127.0.0.1 genta.ecommerce.local`);
    console.log(`Open in browser: http://genta.localhost:5201`);
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Seeding Failed:", err);
    process.exit(1);
});
