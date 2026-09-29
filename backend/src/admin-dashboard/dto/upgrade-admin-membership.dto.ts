import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpgradeAdminMembershipDto {
  /** Longer plan duration in months (must exceed the current membership). */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  planMonths: number;
}
