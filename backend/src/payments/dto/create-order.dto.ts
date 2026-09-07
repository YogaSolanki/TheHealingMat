import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MEMBERSHIP_PLAN_MONTHS } from '../membership-plans';

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
  @IsIn([...MEMBERSHIP_PLAN_MONTHS])
  planMonths?: 3 | 6 | 12;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;

  @IsOptional()
  @IsIn(['now', 'after_current'])
  startMode?: 'now' | 'after_current';
}
