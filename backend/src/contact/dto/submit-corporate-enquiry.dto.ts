import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

const EMPLOYEE_RANGES = [
  '1–10',
  '11–50',
  '51–200',
  '201–500',
  '501–1,000',
  '1,000+',
] as const;

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
  @IsIn([...EMPLOYEE_RANGES])
  employees: string;

  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  message: string;
}
