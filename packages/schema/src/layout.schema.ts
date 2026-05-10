import { z } from 'zod';

export const TemplateTypeEnum = z.enum(['standard', 'visual', 'technical', 'service']);
export type TemplateType = z.infer<typeof TemplateTypeEnum>;

export const UIComponentRefSchema = z.object({
    id: z.string().uuid().or(z.string()), // Unique instance ID for the canvas
    componentId: z.string().min(1, { message: 'Component ID is required' }), // e.g., 'HeroBanner'
    props: z.record(z.string(), z.any()).optional(),
    isHidden: z.boolean().optional(),
    order: z.number().int().nonnegative().optional().default(0),
    dataSource: z.object({
        type: z.enum(['collection', 'products', 'static']).optional(),
        id: z.string().optional(), // reference ID (e.g. collectionId)
    }).optional(),
});

export type UIComponentRef = z.infer<typeof UIComponentRefSchema>;

export const PageTypeEnum = z.enum([
    'home',
    'product_listing',
    'product_detail',
    'all_products',
    'cart',
    'checkout',
    'shipping',
    'payment',
    'review',
    'order_success',
    'profile',
    'system_message',
    'custom_page'
]);
export type PageType = z.infer<typeof PageTypeEnum>;

export const ShopGlobalLayoutSchema = z.object({
    shopId: z.string().optional(), // Optional for Master Templates
    isMaster: z.boolean().default(false),
    templateType: TemplateTypeEnum.default('standard'),
    theme: z.record(z.string(), z.any()).optional().default({}),
    globalComponents: z.array(UIComponentRefSchema).optional().default([]), // For Header, Footer, AnnouncementBar, etc.
});
export type ShopGlobalLayout = z.infer<typeof ShopGlobalLayoutSchema>;

export const ShopPageLayoutSchema = z.object({
    shopId: z.string().optional(),
    isMaster: z.boolean().default(false),
    pageType: PageTypeEnum,
    slug: z.string().optional(), // For custom pages
    components: z.array(UIComponentRefSchema),
});
export type ShopPageLayout = z.infer<typeof ShopPageLayoutSchema>;

/**
 * @deprecated Use ShopGlobalLayout and ShopPageLayout instead
 */
export const ShopLayoutSchema = ShopGlobalLayoutSchema;
export type ShopLayout = ShopGlobalLayout;

/**
 * @deprecated Use ShopGlobalLayout and ShopPageLayout instead
 */
export const CustomerLayoutSchema = ShopGlobalLayoutSchema;
export type CustomerLayout = ShopGlobalLayout;

// Builder Specific View State (used in Admin UI)
export const BuilderStateSchema = z.object({
    globalComponents: z.array(UIComponentRefSchema).optional().default([]),
    pages: z.record(z.string(), z.array(UIComponentRefSchema)), // Mapping pageType -> components for editor
    theme: z.record(z.string(), z.any()).optional().default({}),
});

export type BuilderState = z.infer<typeof BuilderStateSchema>;
