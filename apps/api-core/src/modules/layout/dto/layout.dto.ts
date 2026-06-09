import { IsString, IsNotEmpty, IsObject, IsOptional, IsArray } from 'class-validator';

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

export class SaveBuilderGlobalDto {
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @IsArray()
  @IsOptional()
  globalComponents?: any[];

  @IsObject()
  @IsOptional()
  theme?: Record<string, any>;
}

export class SaveBuilderPageDto {
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @IsString()
  @IsNotEmpty()
  pageType: string;

  @IsArray()
  @IsOptional()
  components?: any[];
}
