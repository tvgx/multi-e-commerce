import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';
import { TemplateTypeEnum } from '@ecommerce/schema';

// UC-01: Tenant Registration (New)
export const RegisterTenantSchema = z.object({
  shopName: z
    .string()
    .min(1, 'shopName is required')
    .max(255, 'shopName must be at most 255 characters'),
  email: z.string().email('Invalid email format').min(1, 'email is required'),
  domain: z
    .string()
    .min(3, 'domain must be at least 3 characters')
    .max(63, 'domain must be at most 63 characters')
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, 'Invalid domain format'),
  ownerName: z
    .string()
    .min(1, 'ownerName is required')
    .max(255, 'ownerName must be at most 255 characters'),
  template: TemplateTypeEnum.optional().default('standard'),
  seedDemoProducts: z.boolean().optional().default(false),
});

// Legacy: Shop Creation (Kept for backward compatibility)
export const CreateShopSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  productsPerPage: z.number().int().positive().optional().default(30),
  templateType: TemplateTypeEnum.optional().default('standard'),
  templateKey: z.string().optional(),
});

export const UpdateShopSchema = z.object({
  name: z.string().optional(),
  domain: z.string().optional(),
  mapAddress: z.string().optional(),
  licenseImageUrl: z.string().url().optional(),
  productsPerPage: z.number().int().positive().optional(),
  bankAccount: z
    .object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      accountHolder: z.string().optional(),
      branch: z.string().optional(),
    })
    .optional(),
  businessLicenseNumber: z.string().optional(),
  businessLicenseIssuedDate: z.string().datetime().optional(),
});

export class RegisterTenantDto extends createZodDto(RegisterTenantSchema) {}
export class CreateShopDto extends createZodDto(CreateShopSchema) {}
export class UpdateShopDto extends createZodDto(UpdateShopSchema) {}
