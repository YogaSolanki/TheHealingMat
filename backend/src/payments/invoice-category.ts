export enum InvoiceCategory {
  Domestic = 'domestic',
  Export = 'export',
  Corporate = 'corporate',
}

export type InvoiceCategoryCode = 'DM' | 'EX' | 'CO';

export function invoiceCategoryCode(
  category: InvoiceCategory,
): InvoiceCategoryCode {
  if (category === InvoiceCategory.Export) return 'EX';
  if (category === InvoiceCategory.Corporate) return 'CO';
  return 'DM';
}

/** Indian financial year label from a date (Apr–Mar), e.g. 26-27. */
export function indianFinancialYear(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const start = m >= 3 ? y : y - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

export function formatInvoiceNumber(
  financialYear: string,
  category: InvoiceCategory,
  serial: number,
): string {
  return `${financialYear}-${invoiceCategoryCode(category)}-${String(serial).padStart(6, '0')}`;
}
