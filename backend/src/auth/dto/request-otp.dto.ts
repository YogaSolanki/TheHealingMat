import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Region } from '../../users/enums/region.enum';

export class RequestOtpDto {
  @IsEnum(Region)
  region: Region;

  @IsIn(['login', 'signup', 'password_reset'])
  purpose: 'login' | 'signup' | 'password_reset';

  /**
   * India mobile OTP delivery.
   * Default: WhatsApp (AiSensy). Pass `sms` to send via MSG91 SMS instead.
   */
  @IsOptional()
  @IsIn(['whatsapp', 'sms'])
  delivery?: 'whatsapp' | 'sms';

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
