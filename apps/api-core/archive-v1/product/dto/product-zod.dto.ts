import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

export const CreateProductSchema = z.object({
  shopId: z.string().min(1, { message: 'shopId is required' }).optional(),
  name: z.string().min(1, { message: 'Product name is required' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  sku: z.string().optional(),
  basePrice: z.number().min(0).max(30000000).optional(),
  weight: z.number().max(20).optional(),
  inStock: z.number().int().min(0).optional().default(0),
  images: z.array(z.string()).optional().default([]),
  attributes: z.record(z.string(), z.any()).optional().default({}),
  collectionIds: z.array(z.string()).optional().default([]),
  optionTypeIds: z.array(z.string()).optional().default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1),
        price: z.number().min(0),
        weight: z.number().optional(),
        inStock: z.number().int().min(0).optional().default(0),
        attributes: z.record(z.string(), z.string()).optional(),
        image: z.string().optional(),
        optionValueIds: z.array(z.string()).optional().default([]),
      }),
    )
    .optional(),
  // MongoDB Rich Content Fields
  descriptionHtml: z.string().optional().default(''),
  videoUrls: z.array(z.string()).optional().default([]),
  seoData: z
    .object({
      metaTitle: z.string().optional().default(''),
      metaDescription: z.string().optional().default(''),
      keywords: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    }),
  customLandingPageLayout: z
    .record(z.string(), z.any())
    .nullable()
    .optional()
    .default(null),
});

export const UpdateProductSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  basePrice: z.number().min(0).max(30000000).optional(),
  weight: z.number().max(20).optional(),
  inStock: z.number().int().min(0).optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  collectionIds: z.array(z.string()).optional(),
  // MongoDB Rich Content Fields for updates
  descriptionHtml: z.string().optional(),
  videoUrls: z.array(z.string()).optional(),
  seoData: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  customLandingPageLayout: z
    .record(z.string(), z.any())
    .nullable()
    .optional(),
});

export const UpdateProductStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
export class UpdateProductStatusDto extends createZodDto(
  UpdateProductStatusSchema,
) {}

