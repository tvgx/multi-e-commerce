import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';
import { UIComponentRefSchema } from '@ecommerce/schema';

export const CreatePageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  sections: z.array(UIComponentRefSchema).optional().default([]),
  isVisible: z.boolean().optional().default(true),
});

export const UpdatePageSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  sections: z.array(UIComponentRefSchema).optional(),
  isVisible: z.boolean().optional(),
});

export class CreatePageDto extends createZodDto(CreatePageSchema as any) {}
export class UpdatePageDto extends createZodDto(UpdatePageSchema as any) {}
