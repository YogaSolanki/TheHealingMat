import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** e.g. 6:30 AM, 11:30 AM, 7:00 PM */
const TIME_LABEL_PATTERN =
  /^(1[0-2]|0?[1-9]):([0-5]\d)\s?(AM|PM)$/i;

export class CreateSessionTimingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(TIME_LABEL_PATTERN, {
    message: 'Time must look like 6:30 AM or 7:00 PM.',
  })
  label: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSessionTimingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(TIME_LABEL_PATTERN, {
    message: 'Time must look like 6:30 AM or 7:00 PM.',
  })
  label?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
