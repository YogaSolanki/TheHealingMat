import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
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

  /** Preferred membership start date (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString({}, { message: 'startsOn must be a valid date (YYYY-MM-DD).' })
  startsOn?: string;

  /** Opt-in: apply the 20% referral benefit (only if account has a referrer). */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  applyReferralDiscount?: boolean;
}
