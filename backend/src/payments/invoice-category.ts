export enum InvoiceCategory {
  Domestic = 'domestic',
  Export = 'export',
  Corporate = 'corporate',
}

export type InvoiceCategoryCode = 'DM' | 'EX' | 'CO';

export const INVOICE_CATEGORIES: InvoiceCategory[] = [
  InvoiceCategory.Domestic,
  InvoiceCategory.Export,
  InvoiceCategory.Corporate,
];

/** Matches labels like 26-27 or 27-28 (two-digit Apr–Mar FY). */
export const FINANCIAL_YEAR_PATTERN = /^\d{2}-\d{2}$/;

export function invoiceCategoryCode(
  category: InvoiceCategory,
): InvoiceCategoryCode {
  if (category === InvoiceCategory.Export) return 'EX';
  if (category === InvoiceCategory.Corporate) return 'CO';
  return 'DM';
}

export function invoiceCategoryLabel(category: InvoiceCategory): string {
  if (category === InvoiceCategory.Export) return 'Export (EX)';
  if (category === InvoiceCategory.Corporate) return 'Corporate (CO)';
  return 'Domestic / retail (DM)';
}

/**
 * Indian financial year label (Apr–Mar) in Asia/Kolkata.
 * Example: 1 Apr 2026 → 26-27, 31 Mar 2027 → 26-27, 1 Apr 2027 → 27-28.
 */
export function indianFinancialYear(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    // Fallback: UTC (should be rare)
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const start = m >= 4 ? y : y - 1;
    return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
  }
  const start = month >= 4 ? year : year - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

export function isValidFinancialYearLabel(value: string): boolean {
  if (!FINANCIAL_YEAR_PATTERN.test(value)) return false;
  const [a, b] = value.split('-').map((part) => Number(part));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  // Allow wrap 99-00; otherwise next year must be start+1 mod 100
  return b === (a + 1) % 100;
}

export function formatInvoiceNumber(
  financialYear: string,
  category: InvoiceCategory,
  serial: number,
): string {
  return `${financialYear}-${invoiceCategoryCode(category)}-${String(serial).padStart(6, '0')}`;
}
