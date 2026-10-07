import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'privateSpacePasswordDiffers', async: false })
class PrivateSpacePasswordDiffersConstraint
  implements ValidatorConstraintInterface
{
  validate(newPassword: unknown, args: ValidationArguments) {
    const dto = args.object as UpdatePrivateSpacePasswordDto;
    if (
      typeof newPassword !== 'string' ||
      typeof dto.currentPassword !== 'string'
    ) {
      return false;
    }
    return newPassword !== dto.currentPassword;
  }

  defaultMessage() {
    return 'New private space password must be different from the current one.';
  }
}

export class UpdatePrivateSpacePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current private space password is required.' })
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New private space password is required.' })
  @MinLength(6, {
    message: 'New private space password must be at least 6 characters.',
  })
  @MaxLength(128)
  @Validate(PrivateSpacePasswordDiffersConstraint)
  newPassword: string;
}
