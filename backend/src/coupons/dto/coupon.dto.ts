import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
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
}

export class AssignCouponDto {
  /** Member referral code — unique per user. */
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  referralCode: string;
}
