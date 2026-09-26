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
import { Gender } from '../../users/enums/gender.enum';
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
  @IsDateString({}, { message: 'dateOfBirth must be YYYY-MM-DD.' })
  dateOfBirth?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(Gender, { message: 'gender must be a valid option.' })
  gender?: Gender | null;

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
}
