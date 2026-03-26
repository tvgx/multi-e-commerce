import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateProductSchema = z.object({
  shopId: z.string().min(1, 'shopId is required'),
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  sku: z.string().min(1, 'SKU is required'),
  basePrice: z.number().min(0).max(30000000, 'Price over 30M policy violation'),
  weight: z.number().max(20, 'Weight over 20KG policy violation').optional(),
  inStock: z.number().int().min(0).optional().default(0),
  images: z.array(z.string()).optional().default([]),
  extraMetadata: z.record(z.any()).optional().default({}),
});

export const UpdateProductSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  basePrice: z.number().min(0).max(30000000).optional(),
  weight: z.number().max(20).optional(),
  inStock: z.number().int().min(0).optional(),
  extraMetadata: z.record(z.any()).optional(),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
