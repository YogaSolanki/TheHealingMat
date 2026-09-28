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
   * Payment reference for the invoice (Razorpay pay_… / UTR / bank note).
   * Required when amount paid is greater than zero.
   */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  paymentRef?: string;

  /**
   * How the customer paid (UPI, Bank transfer, Razorpay, Cash, etc.).
   * Required when amount paid is greater than zero.
   */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  paymentMethod?: string;

  /**
   * Admin-only note: why this membership was created manually.
   * Required for all admin-created memberships.
   */
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  adminNote: string;

  /** List / catalogue price in minor units (paise / cents). */
  @IsOptional()
  @IsInt()
  @Min(0)
  listPricePaise?: number;

  /** Discount in minor units. */
  @IsOptional()
  @IsInt()
  @Min(0)
  discountPaise?: number;

  /** Final amount paid in minor units. Required for invoice when > 0. */
  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaidPaise?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency?: string;

  /**
   * Billing state (India) or country (outside India) when the profile lacks one.
   * Stored on the user for invoice / future GST.
   */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  billingLocation?: string;
}
