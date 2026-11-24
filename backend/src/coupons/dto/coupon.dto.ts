import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class GenerateCouponDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  userName: string;

  @IsIn(['percent', 'fixed'])
  discountType: 'percent' | 'fixed';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  discountValue: number;

  /** Membership term this coupon is valid for. */
  @Type(() => Number)
  @IsInt()
  @IsIn([3, 6, 12])
  planMonths: number;

  /** How many members can redeem this code in total. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class CreateCouponDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  userName: string;

  @IsIn(['percent', 'fixed'])
  discountType: 'percent' | 'fixed';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  discountValue: number;

  /** Membership term this coupon is valid for. */
  @Type(() => Number)
  @IsInt()
  @IsIn([3, 6, 12])
  planMonths: number;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  discountLabel: string;

  @IsString()
  @MinLength(6)
  @MaxLength(40)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'code must be uppercase letters and numbers only',
  })
  code: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class AssignCouponDto {
  /** Single member referral code (legacy). Prefer referralCodes for multi-assign. */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  referralCode?: string;

  /** One or more member referral codes to receive personal single-use coupons. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(40, { each: true })
  referralCodes?: string[];

  /**
   * When assigning to members, default to single-use (1) each.
   * Pass a higher value only if a member may redeem more than once.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxUses?: number;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
