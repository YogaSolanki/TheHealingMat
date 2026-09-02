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

  /** Optional on OTP signup — if omitted, a random password is generated. */
  @ValidateIf((dto: VerifyOtpDto) => dto.password !== undefined)
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password?: string;
}
