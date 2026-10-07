import { Transform } from 'class-transformer';
import {
  IsEmail,
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
}
