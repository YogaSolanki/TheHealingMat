import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateScheduledClassDto {
  @IsDateString({}, { message: 'classDate must be YYYY-MM-DD.' })
  classDate: string;

  @IsUUID('4', { message: 'sessionTimingId must be a valid id.' })
  sessionTimingId: string;

  @IsString()
  @MaxLength(2000)
  @IsUrl(
    { require_protocol: true },
    { message: 'Enter a valid URL including https://' },
  )
  meetingUrl: string;
}

export class UpdateScheduledClassDto {
  @IsOptional()
  @IsDateString({}, { message: 'classDate must be YYYY-MM-DD.' })
  classDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'sessionTimingId must be a valid id.' })
  sessionTimingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @IsUrl(
    { require_protocol: true },
    { message: 'Enter a valid URL including https://' },
  )
  meetingUrl?: string;
}
