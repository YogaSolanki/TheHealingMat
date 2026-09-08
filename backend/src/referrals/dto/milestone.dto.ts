import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
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
