import { IsString, MaxLength, MinLength } from 'class-validator';

export class ApplyReferralDto {
  @IsString()
  @MinLength(2, { message: 'referralCode is required.' })
  @MaxLength(64, { message: 'referralCode must be at most 64 characters.' })
  referralCode: string;
}
