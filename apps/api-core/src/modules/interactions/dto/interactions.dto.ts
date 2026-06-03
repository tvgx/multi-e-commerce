import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsNumber } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ToggleWishlistDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class AddSearchHistoryDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;
}

export class GetReviewsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  productId?: string;
}
