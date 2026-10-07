import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
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

@ValidatorConstraint({ name: 'adminNewPasswordDiffers', async: false })
class AdminNewPasswordDiffersConstraint
  implements ValidatorConstraintInterface
{
  validate(newPassword: unknown, args: ValidationArguments) {
    const dto = args.object as UpdateAdminAccountDto;
    if (typeof newPassword !== 'string' || typeof dto.currentPassword !== 'string') {
      return true;
    }
    return newPassword !== dto.currentPassword;
  }

  defaultMessage() {
    return 'New password must be different from your current password.';
  }
}

export class UpdateAdminAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required.' })
  @MaxLength(PASSWORD_MAX_LENGTH)
  currentPassword: string;

  @ValidateIf((dto: UpdateAdminAccountDto) => dto.newEmail != null && dto.newEmail !== '')
  @IsEmail()
  newEmail?: string;

  @ValidateIf(
    (dto: UpdateAdminAccountDto) =>
      dto.newPassword != null && dto.newPassword !== '',
  )
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `newPassword must be at least ${PASSWORD_MIN_LENGTH} characters`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `newPassword must be at most ${PASSWORD_MAX_LENGTH} characters`,
  })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  @Validate(AdminNewPasswordDiffersConstraint)
  @IsOptional()
  newPassword?: string;
}
