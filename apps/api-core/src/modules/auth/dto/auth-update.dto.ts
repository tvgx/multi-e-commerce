import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  identityNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string; // ISO date string e.g., "1990-01-01"

  @IsString()
  @IsOptional()
  gender?: string; // MALE, FEMALE, OTHER
}
