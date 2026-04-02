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

export const ShopLayoutSchema = z.object({
    shopId: z.string().optional(), // Can be optional for Master Templates
    isMaster: z.boolean().default(false),
    templateType: TemplateTypeEnum.default('standard'),
    pages: z.record(z.string(), z.array(UIComponentRefSchema)), // e.g., { "home": [...], "about": [...] }
    metadata: z.record(z.string(), z.any()).optional().default({}), // Extra metadata like theme colors, font families
});

export type ShopLayout = z.infer<typeof ShopLayoutSchema>;

/**
 * @deprecated Use ShopLayout instead
 */
export const CustomerLayoutSchema = ShopLayoutSchema;
/**
 * @deprecated Use ShopLayout instead
 */
export type CustomerLayout = ShopLayout;

// Builder Specific View State (used in Admin UI)
export const BuilderStateSchema = z.object({
    pages: z.record(z.string(), z.array(UIComponentRefSchema)),
    theme: z.record(z.string(), z.any()).optional().default({}),
});

export type BuilderState = z.infer<typeof BuilderStateSchema>;
