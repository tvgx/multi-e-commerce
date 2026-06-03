import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

export const NavigationItemSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    title: z.string().min(1, 'Title is required'),
    url: z.string().min(1, 'URL is required'),
    items: z.array(NavigationItemSchema).optional(),
  }),
);

export const CreateNavigationSchema = z.object({
  handle: z.string().min(1, 'Handle is required'),
  title: z.string().min(1, 'Title is required'),
  items: z.array(NavigationItemSchema).optional().default([]),
});

export const UpdateNavigationSchema = z.object({
  title: z.string().optional(),
  items: z.array(NavigationItemSchema).optional(),
});

export class CreateNavigationDto extends createZodDto(CreateNavigationSchema) {}
export class UpdateNavigationDto extends createZodDto(UpdateNavigationSchema) {}
