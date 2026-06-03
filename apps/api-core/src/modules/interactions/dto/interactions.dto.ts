import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
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

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class GetReviewsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  productId?: string;
}
