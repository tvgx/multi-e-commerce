import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateOptionValueSchema = z.object({
  name: z.string().min(1, 'OptionValue name is required'),
  presentation: z.string().min(1, 'OptionValue presentation is required'),
});

export const CreateOptionTypeSchema = z.object({
  name: z.string().min(1, 'OptionType name is required'),
  presentation: z.string().min(1, 'OptionType presentation is required'),
  values: z.array(CreateOptionValueSchema).optional().default([]),
});

export const UpdateOptionTypeSchema = z.object({
  name: z.string().optional(),
  presentation: z.string().optional(),
  values: z.array(CreateOptionValueSchema).optional(),
});

export class CreateOptionTypeDto extends createZodDto(CreateOptionTypeSchema as any) {}
export class UpdateOptionTypeDto extends createZodDto(UpdateOptionTypeSchema as any) {}
