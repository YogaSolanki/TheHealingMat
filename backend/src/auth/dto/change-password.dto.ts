import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from './password.rules';

@ValidatorConstraint({ name: 'isDifferentFromCurrentPassword', async: false })
class IsDifferentFromCurrentPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(newPassword: unknown, args: ValidationArguments) {
    const dto = args.object as ChangePasswordDto;
    if (typeof newPassword !== 'string' || typeof dto.currentPassword !== 'string') {
      return false;
    }
    return newPassword !== dto.currentPassword;
  }

  defaultMessage() {
    return 'New password must be different from your current password.';
  }
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required.' })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `currentPassword must be at most ${PASSWORD_MAX_LENGTH} characters`,
  })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `newPassword must be at least ${PASSWORD_MIN_LENGTH} characters`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `newPassword must be at most ${PASSWORD_MAX_LENGTH} characters`,
  })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  @Validate(IsDifferentFromCurrentPasswordConstraint)
  newPassword: string;
}
