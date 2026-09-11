import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

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

  @IsString()
  @MinLength(6)
  @MaxLength(40)
  phone: string;

  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  message: string;
}
