import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(6)
  @MaxLength(40)
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
