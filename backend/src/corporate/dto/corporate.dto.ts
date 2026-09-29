import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  domains: string[];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  gstNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  billingPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  billingAddress?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  domains?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  gstNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string | null;

  @IsOptional()
  @IsEmail()
  billingEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  billingPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  billingAddress?: string | null;
}

export class CreateCorporatePlanDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  planMonths: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  employeeCount: number;

  /** 0–100: share of total list price paid by the company. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  companyPayPercent: number;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  paymentMethod: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  paymentRef: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  adminNote: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billingLocation?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}/)
  startsAt?: string;
}

export class RequestCorporateCouponOtpDto {
  @IsString()
  @MinLength(3)
  couponCode: string;

  @IsEmail()
  email: string;
}

export class VerifyCorporateCouponOtpDto {
  @IsString()
  @MinLength(3)
  couponCode: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(8)
  code: string;
}

export class InspectCorporateCouponDto {
  @IsString()
  @MinLength(3)
  couponCode: string;
}
