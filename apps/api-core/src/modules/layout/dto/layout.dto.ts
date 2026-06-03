import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateMasterTemplateDto {
  @IsString()
  @IsNotEmpty()
  industry: string;

  @IsObject()
  @IsNotEmpty()
  schema: Record<string, any>;
}

export class UpdateTenantLayoutDto {
  @IsObject()
  @IsNotEmpty()
  overrides: Record<string, any>;
}
