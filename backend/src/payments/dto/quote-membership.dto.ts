import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QuoteMembershipDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  planMonths: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;
}
