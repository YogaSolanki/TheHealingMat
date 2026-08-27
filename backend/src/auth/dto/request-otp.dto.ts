import {
  IsEmail,
  IsEnum,
  IsIn,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Region } from '../../users/enums/region.enum';

export class RequestOtpDto {
  @IsEnum(Region)
  region: Region;

  @IsIn(['login', 'signup'])
  purpose: 'login' | 'signup';

  @ValidateIf((dto: RequestOtpDto) => dto.region === Region.India)
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'mobile must be a valid phone number',
  })
  mobile?: string;

  @ValidateIf((dto: RequestOtpDto) => dto.region === Region.OutsideIndia)
  @IsEmail()
  email?: string;
}
