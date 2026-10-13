import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateMilestoneDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  referralCount: number;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  rewardTitle: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rewardDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  referralCount?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  rewardTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rewardDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class UpdateRedemptionDto {
  @IsIn(['pending', 'fulfilled', 'rejected'])
  status: 'pending' | 'fulfilled' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}

/** Optional delivery details when redeeming a milestone reward. */
export class RedeemMilestoneDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsEmail({}, { message: 'email must be a valid email.' })
  @MaxLength(160)
  email?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @MaxLength(500, { message: 'address must be at most 500 characters.' })
  address?: string | null;
}
