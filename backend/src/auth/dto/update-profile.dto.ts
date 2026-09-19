import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Gender } from '../../users/enums/gender.enum';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters.' })
  @MaxLength(120, { message: 'fullName must be at most 120 characters.' })
  fullName: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString({}, { message: 'dateOfBirth must be a valid date (YYYY-MM-DD).' })
  dateOfBirth?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(Gender, { message: 'gender must be a valid option.' })
  gender?: Gender | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @MaxLength(80, { message: 'state must be at most 80 characters.' })
  state?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @MaxLength(40, { message: 'preferredClassTime must be at most 40 characters.' })
  preferredClassTime?: string | null;
}
