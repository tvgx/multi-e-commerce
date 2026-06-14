import { z } from 'zod';
import { ShopPageLayoutSchema } from './layout.schema';

/**
 * Wraps a storefront-renderable {@link ShopPageLayoutSchema} with the Figma
 * provenance metadata produced by apps/design-agent's extraction pipeline.
 *
 * The `page` field is intentionally the *existing* layout schema so that an
 * extracted document is directly renderable by the storefront — there is no
 * parallel "Figma layout" model to keep in sync. `figma_node_id` is the unique
 * upsert key for the MongoDB `page_layouts` collection.
 */
export const FigmaPageExtractionSchema = z.object({
    figma_node_id: z.string().min(1, { message: 'figma_node_id is required' }),
    figma_file_key: z.string().min(1, { message: 'figma_file_key is required' }),
    figma_version: z.string().optional(),
    name: z.string().optional(), // The Figma frame name (human label of the page)
    tenant_id: z.string().nullable().optional(), // null = shared/global, set when multi-tenant
    extracted_at: z.union([z.string(), z.date()]),
    page: ShopPageLayoutSchema,
});

export type FigmaPageExtraction = z.infer<typeof FigmaPageExtractionSchema>;
