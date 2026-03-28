import { z } from 'zod';

export const UIComponentRefSchema = z.object({
    componentId: z.string().min(1, { message: 'Component ID is required' }),
    props: z.record(z.string(), z.any()).optional(),
    isHidden: z.boolean().optional(),
    order: z.number().int().nonnegative().optional().default(0),
});

export type UIComponentRef = z.infer<typeof UIComponentRefSchema>;

export const CustomerLayoutSchema = z.object({
    shopId: z.string().optional(), // Can be optional for Master Templates
    isMaster: z.boolean().default(false),
    baseLayoutId: z.string().nullable().optional(),
    global: z.object({
        header: z.array(UIComponentRefSchema).optional().default([]),
        footer: z.array(UIComponentRefSchema).optional().default([]),
    }),
    pages: z.record(z.string(), z.array(UIComponentRefSchema)), // e.g., { "home": [...], "catalog": [...] }
    metadata: z.record(z.string(), z.any()).optional(), // Extra metadata like theme colors, font families
});

export type CustomerLayout = z.infer<typeof CustomerLayoutSchema>;
