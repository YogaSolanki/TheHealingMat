import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  /**
   * Optional for trial signup — when omitted/blank the server generates one.
   * Strength is enforced in AuthService only when a password is provided.
   */
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  @IsOptional()
  @IsString()
  password?: string;

  /** Optional. Stored permanently as Referring User → Referred User. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralCode?: string;
}
