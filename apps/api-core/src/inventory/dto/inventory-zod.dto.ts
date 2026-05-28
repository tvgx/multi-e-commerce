import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

export const CreateStockLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  adminName: z.string().optional(),
  active: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  shopId: z.string().uuid().optional(),
});

export const UpdateStockLocationSchema = z.object({
  name: z.string().optional(),
  adminName: z.string().optional(),
  active: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const AdjustStockItemSchema = z.object({
  variantId: z.string().uuid('Invalid variant UUID'),
  countOnHand: z.number().int().min(0, 'Count on hand cannot be negative'),
  backorderable: z.boolean().optional(),
});

export class CreateStockLocationDto extends createZodDto(
  CreateStockLocationSchema as any,
) {}
export class UpdateStockLocationDto extends createZodDto(
  UpdateStockLocationSchema as any,
) {}
export class AdjustStockItemDto extends createZodDto(
  AdjustStockItemSchema as any,
) {}
