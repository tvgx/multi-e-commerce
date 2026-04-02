import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

export const CreateCollectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateCollectionSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  layoutJson: z.any().optional(),
});

export const AddProductsToCollectionSchema = z.object({
  productIds: z.array(z.string().uuid()),
});

export class CreateCollectionDto extends createZodDto(CreateCollectionSchema as any) {}
export class UpdateCollectionDto extends createZodDto(UpdateCollectionSchema as any) {}
export class AddProductsToCollectionDto extends createZodDto(AddProductsToCollectionSchema as any) {}
