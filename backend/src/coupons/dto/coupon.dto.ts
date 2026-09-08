import { Type } from 'class-transformer';
import {
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
  /** Member referral code — unique per user. */
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  referralCode: string;

  /**
   * When assigning to one member, default to single-use (1).
   * Pass a higher value only if that member may redeem more than once.
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
