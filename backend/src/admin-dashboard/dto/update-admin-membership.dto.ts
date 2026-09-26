import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAdminMembershipDto {
  @IsOptional()
  @IsIn(['active', 'scheduled', 'expired'], {
    message: 'status must be active, scheduled, or expired.',
  })
  status?: 'active' | 'scheduled' | 'expired';

  @IsOptional()
  @IsDateString({}, { message: 'startsAt must be a valid ISO date.' })
  startsAt?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endsAt must be a valid ISO date.' })
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(36)
  planMonths?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  planName?: string;
}
