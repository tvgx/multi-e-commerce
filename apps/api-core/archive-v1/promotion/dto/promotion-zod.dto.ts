import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreatePromotionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  code: z.string().min(1, 'Code is required').toUpperCase(),
  usageLimit: z.number().int().positive().optional().nullable(),
  startsAt: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()).optional().nullable(),
  expiresAt: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  discountValue: z.number().nonnegative('Discount value must be non-negative'),
});

export const UpdatePromotionSchema = CreatePromotionSchema.partial();

export class CreatePromotionDto extends createZodDto(CreatePromotionSchema as any) {}
export class UpdatePromotionDto extends createZodDto(UpdatePromotionSchema as any) {}
