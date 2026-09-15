import { IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @MaxLength(2000)
  @IsUrl({ require_protocol: true }, { message: 'Enter a valid URL including https://' })
  liveSessionUrl?: string | null;
}
