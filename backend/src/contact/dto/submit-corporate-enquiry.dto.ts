import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SubmitCorporateEnquiryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  company: string;

  @IsEmail()
  @MaxLength(180)
  email: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/[\s-]/g, '') : value,
  )
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  message: string;

  /** Honeypot — must stay empty. Bots that fill it are rejected silently. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  /** Client timestamp (ms) when the form was opened — used for timing checks. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  formOpenedAt?: number;
}
