import {
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from './password.rules';

export class ResetPasswordDto {
  @IsUUID()
  challengeId: string;

  @IsString()
  @MinLength(4)
  @MaxLength(8)
  code: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password: string;
}
