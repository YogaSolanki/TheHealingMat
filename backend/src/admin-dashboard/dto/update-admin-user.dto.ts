import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from '../../auth/dto/password.rules';
import { Region } from '../../users/enums/region.enum';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters.' })
  @MaxLength(120, { message: 'fullName must be at most 120 characters.' })
  fullName?: string;

  @IsOptional()
  @IsEnum(Region, { message: 'region must be india or outside_india.' })
  region?: Region;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsEmail({}, { message: 'email must be a valid email.' })
  @MaxLength(160)
  email?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @Matches(/^\+?[0-9\s-]{8,20}$/, {
    message: 'mobile must be a valid phone number.',
  })
  mobile?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @MaxLength(80)
  state?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @MaxLength(40)
  preferredClassTime?: string | null;

  @IsOptional()
  @IsBoolean()
  hasUsedFreeTrial?: boolean;

  /**
   * Referrer’s referral code. Empty string or null clears Referred by.
   * Must match an existing member’s code (not this user).
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @MaxLength(40)
  referralCode?: string | null;

  /** When provided, replaces the member’s login password. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MESSAGE })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_MESSAGE })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password?: string;
}
