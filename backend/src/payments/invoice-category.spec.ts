import {
  InvoiceCategory,
  formatInvoiceNumber,
  indianFinancialYear,
  isValidFinancialYearLabel,
} from './invoice-category';

describe('invoice-category', () => {
  describe('indianFinancialYear', () => {
    it('uses Asia/Kolkata Apr–Mar boundaries', () => {
      // 31 Mar 2027 18:30 UTC = 1 Apr 2027 00:00 IST → 27-28
      expect(indianFinancialYear(new Date('2027-03-31T18:30:00.000Z'))).toBe(
        '27-28',
      );
      // 31 Mar 2027 18:29 UTC = 31 Mar 2027 23:59 IST → 26-27
      expect(indianFinancialYear(new Date('2027-03-31T18:29:00.000Z'))).toBe(
        '26-27',
      );
      // Mid FY
      expect(indianFinancialYear(new Date('2026-10-13T06:00:00.000Z'))).toBe(
        '26-27',
      );
    });
  });

  describe('formatInvoiceNumber', () => {
    it('formats retail / domestic numbers', () => {
      expect(
        formatInvoiceNumber('27-28', InvoiceCategory.Domestic, 1),
      ).toBe('27-28-DM-000001');
      expect(
        formatInvoiceNumber('26-27', InvoiceCategory.Domestic, 17),
      ).toBe('26-27-DM-000017');
    });
  });

  describe('isValidFinancialYearLabel', () => {
    it('accepts consecutive two-digit years', () => {
      expect(isValidFinancialYearLabel('26-27')).toBe(true);
      expect(isValidFinancialYearLabel('99-00')).toBe(true);
      expect(isValidFinancialYearLabel('26-28')).toBe(false);
      expect(isValidFinancialYearLabel('2026-27')).toBe(false);
    });
  });
});
