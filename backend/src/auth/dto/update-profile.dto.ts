import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from '../../users/enums/gender.enum';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters.' })
  @MaxLength(120, { message: 'fullName must be at most 120 characters.' })
  fullName: string;

  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth must be a valid date (YYYY-MM-DD).' })
  dateOfBirth?: string | null;

  @IsOptional()
  @IsEnum(Gender, { message: 'gender must be a valid option.' })
  gender?: Gender | null;
}
