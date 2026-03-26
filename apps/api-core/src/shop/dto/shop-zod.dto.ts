import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateShopSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  productsPerPage: z.number().int().positive().optional().default(30),
});

export const UpdateShopSchema = z.object({
  name: z.string().optional(),
  domain: z.string().optional(),
  mapAddress: z.string().optional(),
  licenseImageUrl: z.string().url().optional(),
  productsPerPage: z.number().int().positive().optional(),
});

export class CreateShopDto extends createZodDto(CreateShopSchema) {}
export class UpdateShopDto extends createZodDto(UpdateShopSchema) {}
