import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  FINANCIAL_YEAR_PATTERN,
  InvoiceCategory,
} from '../invoice-category';

export class UpdateInvoiceFinancialYearDto {
  /**
   * Set to a label like "26-27" to force that FY on new invoices,
   * or null / "" to use automatic Asia/Kolkata FY (resets on 1 April).
   */
  @ValidateIf((_, value) => value != null && String(value).trim() !== '')
  @IsString()
  @Matches(FINANCIAL_YEAR_PATTERN, {
    message: 'Financial year must look like 26-27.',
  })
  financialYearOverride: string | null;
}

export class UpdateInvoiceNextSerialDto {
  @IsEnum(InvoiceCategory)
  category: InvoiceCategory;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999999)
  nextSerial: number;

  @IsOptional()
  @IsString()
  @Matches(FINANCIAL_YEAR_PATTERN, {
    message: 'Financial year must look like 26-27.',
  })
  financialYear?: string;
}
