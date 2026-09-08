import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  /** Amount in paise. Ignored when planMonths is provided. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100, { message: 'amount must be at least 100 paise' })
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  receipt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  planMonths?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;

  @IsOptional()
  @IsIn(['now', 'after_current'])
  startMode?: 'now' | 'after_current';
}
