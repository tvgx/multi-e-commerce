import { z } from 'zod';

export const UIComponentRefSchema = z.object({
    id: z.string().uuid().or(z.string()), // Unique instance ID for the canvas
    componentId: z.string().min(1, { message: 'Component ID is required' }), // e.g., 'HeroBanner'
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
    metadata: z.record(z.string(), z.any()).optional().default({}), // Extra metadata like theme colors, font families
});

export type CustomerLayout = z.infer<typeof CustomerLayoutSchema>;

// Builder Specific View State (used in Admin UI)
export const BuilderStateSchema = z.object({
    pages: z.record(z.string(), z.array(UIComponentRefSchema)),
    theme: z.record(z.string(), z.any()).optional().default({}),
});

export type BuilderState = z.infer<typeof BuilderStateSchema>;
