import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @MaxLength(2000)
  @IsUrl(
    { require_protocol: true },
    { message: 'Enter a valid URL including https://' },
  )
  liveSessionUrl?: string | null;

  /** Global referral discount percent (0–100). Applies to all referral codes. */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Referral discount must be a whole number.' })
  @Min(0, { message: 'Referral discount cannot be negative.' })
  @Max(100, { message: 'Referral discount cannot exceed 100%.' })
  referralDiscountPercent?: number;
}
