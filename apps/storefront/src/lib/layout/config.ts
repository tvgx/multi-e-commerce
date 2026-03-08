// apps/storefront/src/lib/layout/config.ts

/**
 * MOCK LOCAL CONFIGURATION
 * 
 * In a real scenario, this file is actively edited by the frontend developer.
 * The `npm run watch:layout` CLI tool will listen to this file and sync its contents
 * via WebSockets to the NestJS Backend for live preview.
 */

export const devLayoutConfig = {
    shopId: 'DEV_SHOP_001',
    baseTemplateType: 'fashion', // 'fashion' | 'home-appliances' | 'mom-and-baby' | 'ready-to-eat'
    global: {
        header: [
            {
                componentId: 'HeroMarquee',
                order: 0,
                props: { text: "⚡ DEV MODE LOCAL SYNC - FREE SHIPPING TODAY" }
            },
            {
                componentId: 'StandardHeader',
                order: 1,
                props: { showSearch: true, showCart: true }
            }
        ],
        footer: []
    },
    pages: {
        home: [
            {
                componentId: 'Hero',
                order: 0,
                props: {
                    title: "Dev Storefront Preview",
                    subtitle: "This layout is currently being edited locally via config.ts",
                    imageUrl: "https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80"
                }
            },
            {
                componentId: 'FeaturedProducts',
                order: 1
            }
        ]
    }
};
