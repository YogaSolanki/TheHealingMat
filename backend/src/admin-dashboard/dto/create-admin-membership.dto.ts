import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAdminMembershipDto {
  @IsInt()
  @Min(1)
  @Max(36)
  planMonths: number;

  /**
   * add = start an active membership now (supersedes any other active).
   * renew = schedule the next term after the current active membership (max 1).
   */
  @IsOptional()
  @IsIn(['add', 'renew'], {
    message: 'mode must be add or renew.',
  })
  mode?: 'add' | 'renew';

  @IsOptional()
  @IsIn(['active', 'scheduled'], {
    message: 'status must be active or scheduled.',
  })
  status?: 'active' | 'scheduled';

  /** Required when status is scheduled (non-renew). Ignored for add/active and renew. */
  @IsOptional()
  @IsDateString({}, { message: 'startsAt must be a valid ISO date.' })
  startsAt?: string;

  /** Link to an existing payment order (e.g. paid but membership never created). */
  @IsOptional()
  @IsUUID()
  paymentOrderId?: string;

  /**
   * Optional payment reference shown on the auto PDF invoice.
   * If this is a Razorpay payment id (pay_…), we also try to attach any linked Razorpay invoice.
   */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  paymentRef?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaidPaise?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency?: string;
}
