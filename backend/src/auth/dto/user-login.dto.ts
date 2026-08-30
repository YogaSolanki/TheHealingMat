import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Region } from '../../users/enums/region.enum';
import { PASSWORD_MAX_LENGTH } from './password.rules';

export class UserLoginDto {
  @IsEnum(Region)
  region: Region;

  @ValidateIf((dto: UserLoginDto) => dto.region === Region.India)
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'mobile must be a valid phone number',
  })
  mobile?: string;

  @ValidateIf((dto: UserLoginDto) => dto.region === Region.OutsideIndia)
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(1)
  @Matches(/^[\s\S]{1,72}$/, {
    message: `password must be at most ${PASSWORD_MAX_LENGTH} characters`,
  })
  password: string;
}
