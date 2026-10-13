import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const DATE_YMD = /^\d{4}-\d{2}-\d{2}$/;

export class ExportUsersDto {
  @IsOptional()
  @IsIn(['all', 'india', 'outside_india'])
  region?: 'all' | 'india' | 'outside_india';

  /** trial = has trial registration; membership = has any membership; none = neither */
  @IsOptional()
  @IsIn(['all', 'trial', 'membership', 'none'])
  accessType?: 'all' | 'trial' | 'membership' | 'none';

  @IsOptional()
  @IsIn(['all', 'active', 'inactive'])
  accountStatus?: 'all' | 'active' | 'inactive';

  @IsOptional()
  @IsIn(['all', 'createdAt', 'trialStartsAt', 'membershipStartsAt'])
  dateField?: 'all' | 'createdAt' | 'trialStartsAt' | 'membershipStartsAt';

  @IsOptional()
  @IsString()
  @Matches(DATE_YMD, { message: 'dateFrom must be YYYY-MM-DD.' })
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(DATE_YMD, { message: 'dateTo must be YYYY-MM-DD.' })
  dateTo?: string;
}
