import {
  IsBoolean,
  IsDateString,
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
import { Gender } from '../../users/enums/gender.enum';
import { Region } from '../../users/enums/region.enum';

export class CreateAdminUserDto {
  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters.' })
  @MaxLength(120, { message: 'fullName must be at most 120 characters.' })
  fullName: string;

  @IsEnum(Region, { message: 'region must be india or outside_india.' })
  region: Region;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @Matches(/^\+?[0-9\s-]{8,20}$/, {
    message: 'mobile must be a valid phone number.',
  })
  mobile?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsEmail({}, { message: 'email must be a valid email.' })
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MESSAGE })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_MESSAGE })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsDateString({}, { message: 'dateOfBirth must be YYYY-MM-DD.' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'gender must be a valid option.' })
  gender?: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  preferredClassTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralCode?: string;

  /** When true, starts the free trial like website trial signup. Default false. */
  @IsOptional()
  @IsBoolean()
  startFreeTrial?: boolean;
}
