import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpgradeAdminMembershipDto {
  /** Longer plan duration in months (must exceed the current membership). */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  planMonths: number;

  /**
   * New plan list / catalogue price in minor units (paise / cents).
   * Defaults to the upgraded plan’s catalog price.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  listPricePaise?: number;

  /**
   * Total discount in minor units on the upgrade invoice (prior payment credit
   * plus any extra admin discount). Defaults to min(already paid, list price).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountPaise?: number;

  /**
   * Additional amount paid for this upgrade in minor units.
   * Defaults to list − credit. Invoice is issued when this is greater than zero.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountPaidPaise?: number;

  /**
   * How the additional upgrade was paid.
   * Required when amountPaidPaise is greater than zero.
   */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  paymentMethod?: string;

  /**
   * Payment reference for the upgrade invoice (UTR / pay_… / note).
   * Required when amountPaidPaise is greater than zero.
   */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  paymentRef?: string;

  /** Optional admin note; defaults to an upgrade summary. */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  adminNote?: string;
}
