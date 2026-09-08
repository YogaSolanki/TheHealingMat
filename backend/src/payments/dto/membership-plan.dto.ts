import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMembershipPlanDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  months: number;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  /** Price in whole rupees (e.g. 3650). Converted to paise server-side. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceRupees: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  perDayRupees: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  perk?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateMembershipPlanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  months?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceRupees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perDayRupees?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  perk?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
