import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QuoteMembershipDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  planMonths: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;

  /** Opt-in: apply the 20% referral benefit (only if account has a referrer). */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  applyReferralDiscount?: boolean;
}
