import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MEMBERSHIP_PLAN_MONTHS } from '../membership-plans';

export class QuoteMembershipDto {
  @Type(() => Number)
  @IsIn([...MEMBERSHIP_PLAN_MONTHS])
  planMonths: 3 | 6 | 12;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;
}
