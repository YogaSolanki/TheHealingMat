import {
  IsOptional,
  IsString,
  IsUUID,
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
} from './password.rules';

export class VerifyOtpDto {
  @IsUUID()
  challengeId: string;

  @IsString()
  @MinLength(4)
  @MaxLength(8)
  code: string;

  /** Required when creating a new account (signup). */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  /** Required when creating a new account (signup). Stored as a bcrypt hash. */
  @ValidateIf((dto: VerifyOtpDto) => Boolean(dto.fullName?.trim()))
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password?: string;

  /** Optional. Stored permanently as Referring User → Referred User. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralCode?: string;
}
