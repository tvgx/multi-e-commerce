import mongoose from 'mongoose';
import { ShopTemplate, MongoProduct } from './mongodb/models';

const MONGODB_URI = process.env.MONGO_DB_ATLAS || 'mongodb://localhost:27017/ecommerce';

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data for the shop
        const shopId = 'demo-shop-123';
        await ShopTemplate.deleteMany({ shopId });
        await MongoProduct.deleteMany({ shopId });

        // 1. Seed ShopTemplate (Zustand layout)
        const template = new ShopTemplate({
            shopId: shopId,
            publishedData: {
                deviceMode: "desktop",
                activeSectionId: null,
                sections: [
                    {
                        id: "hero-1",
                        type: "Hero",
                        props: {
                            title: "Welcome to the Future of Commerce",
                            subtitle: "Powered by Headless CMS and Zero-File UI.",
                            primaryCtaText: "Shop the Collection",
                            primaryCtaLink: "/catalog",
                            imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80"
                        }
                    }
                ]
            },
            draftData: {}
        });
        await template.save();
        console.log('Seeded ShopTemplate successfully.');

        // 2. Seed Universal Product
        const productData = {
            shopId: shopId,
            name: "Tai nghe iPhone Bluetooth Thế Hệ 5",
            description: "<p>Tai nghe chống ồn chủ động đỉnh cao</p>",
            images: ["cover.jpg"],
            category: "Electronics",
            basePrice: { value: 150.00, currency: "USD" },
            totalInventory: 100,
            status: "ACTIVE",
            attributes: [
                { name: "Brand", value: "Apple" },
                { name: "Warranty", value: "12 Months" }
            ],
            tierVariations: [
                {
                    name: "Màu sắc",
                    options: ["Đen", "Bạc"],
                    images: ["iphone-black.jpg", "iphone-silver.jpg"]
                }
            ],
            variants: [
                {
                    sku: "IPH-BLK",
                    tierIndex: [0],
                    priceOverride: null,
                    stock: 40,
                    image: "iphone-black.jpg"
                },
                {
                    sku: "IPH-SLV",
                    tierIndex: [1],
                    priceOverride: { value: 160.00, currency: "USD" },
                    stock: 60,
                    image: "iphone-silver.jpg"
                }
            ]
        };

        let existingMongoProduct = await MongoProduct.findOne({ shopId: productData.shopId, name: productData.name });

        if (!existingMongoProduct) {
            existingMongoProduct = new MongoProduct(productData);
            await existingMongoProduct.save();
            console.log(`[MongoDB]     (+) Created layout for product: ${productData.name}`);
        } else {
            console.log(`[MongoDB]     (~) Product already exists: ${productData.name}`);
        }

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

seed();
