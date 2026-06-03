import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOptionTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  presentation: string;
}

export class UpdateOptionTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  presentation?: string;
}
