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

  @IsOptional()
  @IsIn(['active', 'scheduled'], {
    message: 'status must be active or scheduled.',
  })
  status?: 'active' | 'scheduled';

  /** Required when status is scheduled. Ignored when status is active (starts now). */
  @IsOptional()
  @IsDateString({}, { message: 'startsAt must be a valid ISO date.' })
  startsAt?: string;

  /** Link to an existing payment order (e.g. paid but membership never created). */
  @IsOptional()
  @IsUUID()
  paymentOrderId?: string;

  /** Razorpay invoice id pasted by admin (e.g. inv_…). */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  razorpayInvoiceId?: string;

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
