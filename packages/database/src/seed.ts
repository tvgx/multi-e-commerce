import mongoose from 'mongoose';
import { ShopPage } from './mongodb/models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data for the shop
        const shopId = 'shop_123';
        await ShopPage.deleteMany({ shop_id: shopId });

        // 1. Home Page Configuration
        const homePage = new ShopPage({
            shop_id: shopId,
            page_type: 'home',
            slug: '/',
            components: [
                {
                    component_id: 'announcement-bar',
                    props: {
                        text: 'Winter Collection 2026 is here! Free shipping over $50.',
                        backgroundColor: '#171717',
                        textColor: '#fafafa'
                    }
                },
                {
                    component_id: 'hero',
                    props: {
                        title: 'Welcome to the Future of Commerce',
                        subtitle: 'Powered by headless CMS and Zero-File UI.',
                        primaryCtaText: 'Shop the Collection',
                        primaryCtaLink: '/catalog',
                        imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80'
                    }
                },
                {
                    component_id: 'featured-collection',
                    props: {
                        title: 'Top Picks For You',
                        description: 'Curated products based on latest trends.',
                        products: [
                            { id: 'p1', title: 'Silk Blouse', price: '$89.00', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60' },
                            { id: 'p2', title: 'Leather Tote', price: '$120.00', imageUrl: 'https://images.unsplash.com/photo-1551537482-f209bfc4487b?auto=format&fit=crop&w=500&q=60' }
                        ]
                    }
                }
            ]
        });

        await homePage.save();
        console.log('Seeded Home Page configuration successfully.');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

seed();
