import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SubmitContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/[\s-]/g, '') : value,
  )
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  message: string;
}
