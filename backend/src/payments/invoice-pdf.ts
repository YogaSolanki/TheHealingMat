/**
 * Branded membership invoice PDF matching The Healing Mat invoice template.
 * Domestic (DM / INR) and international (EX / USD) variants.
 *
 * Layout fills A4 with large, clear type — same structure as the design mockup.
 */
import { existsSync } from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

export type InvoicePdfInput = {
  invoiceNo: string;
  issuedAt: Date;
  paidAt: Date;
  memberName: string;
  memberEmail: string | null;
  memberMobile: string | null;
  /** India: state. Outside India: country. */
  memberLocation: string | null;
  isInternational: boolean;
  planName: string;
  planMonths: number;
  listPricePaise: number;
  discountPaise: number;
  discountLabel: string | null;
  amountPaidPaise: number;
  currency: 'INR' | 'USD';
  paymentRef: string | null;
  paymentMethod: string;
  startsAt: Date;
  endsAt: Date;
};

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 36;

const COMPANY = {
  name: 'The Healing Mat',
  address:
    '51, 5th Floor, Aditya Gold Crest, Vaibhav Khand, Indirapuram, Ghaziabad, Uttar Pradesh – 201010, India',
  phone: '+91 80000 45035',
  email: 'hello@thehealingmat.yoga',
  website: 'www.thehealingmat.yoga',
} as const;

const NAVY = '#1A365D';
const NAVY_SOFT = '#2A4A6E';
const LIGHT_BLUE = '#EAF5FB';
const GREY_BOX = '#F3F3F3';
const MUTED = '#4A5A6A';
const RULE = '#1A365D';
const TABLE_LINE = '#D2E3EF';

function assetsRoot() {
  return path.resolve(__dirname, '..', '..', 'assets');
}

function fontPath(file: string) {
  return path.join(assetsRoot(), 'fonts', file);
}

function logoPath() {
  const full = path.join(assetsRoot(), 'images', 'full-logo-invoice.png');
  if (existsSync(full)) return full;
  const fullSrc = path.join(assetsRoot(), 'images', 'full-logo.png');
  if (existsSync(fullSrc)) return fullSrc;
  return path.join(assetsRoot(), 'images', 'logo-icon-invoice.png');
}

function indianFinancialYear(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const start = m >= 3 ? y : y - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

function invoiceSerial(membershipId: string): string {
  let hash = 0;
  for (let i = 0; i < membershipId.length; i += 1) {
    hash = (hash * 31 + membershipId.charCodeAt(i)) >>> 0;
  }
  return String(hash % 1_000_000).padStart(6, '0');
}

/** e.g. 26-27-DM-000123 or 26-27-EX-000045 */
export function buildInvoiceNumber(input: {
  issuedAt: Date;
  currency: 'INR' | 'USD';
  membershipId: string;
}): string {
  const fy = indianFinancialYear(input.issuedAt);
  const kind = input.currency === 'USD' ? 'EX' : 'DM';
  return `${fy}-${kind}-${invoiceSerial(input.membershipId)}`;
}

function formatMoney(minorUnits: number, currency: 'INR' | 'USD'): string {
  const major = minorUnits / 100;
  if (currency === 'USD') {
    return major.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return major.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatPaymentDate(date: Date, international: boolean): string {
  if (international) {
    const d = new Date(date);
    const day = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    const t = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
    return `${day}, ${t} (UTC)`;
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || '';
  const monthRaw = get('month').replace(/\.$/, '');
  const month = monthRaw.length > 3 ? monthRaw.slice(0, 3) : monthRaw;
  return `${get('day')} ${month} ${get('year')}, ${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
}

function currencyMark(currency: 'INR' | 'USD'): string {
  return currency === 'USD' ? 'USD' : '₹';
}

function drawPinIcon(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  color: string,
) {
  doc.save();
  doc.lineWidth(1.1).strokeColor(color).fillColor(color);
  doc
    .moveTo(x + 4, y)
    .bezierCurveTo(x + 8, y, x + 8, y + 4.5, x + 4, y + 9)
    .bezierCurveTo(x, y + 4.5, x, y, x + 4, y)
    .stroke();
  doc.circle(x + 4, y + 3.2, 1.4).fill();
  doc.restore();
}

function drawPhoneIcon(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  color: string,
) {
  doc.save();
  doc.lineWidth(1.1).strokeColor(color);
  doc.roundedRect(x + 1.2, y, 5.6, 9, 1.2).stroke();
  doc.moveTo(x + 2.5, y + 7.2).lineTo(x + 5.5, y + 7.2).stroke();
  doc.restore();
}

function drawMailIcon(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  color: string,
) {
  doc.save();
  doc.lineWidth(1.1).strokeColor(color);
  doc.rect(x, y + 1.5, 9, 6).stroke();
  doc
    .moveTo(x, y + 1.5)
    .lineTo(x + 4.5, y + 5)
    .lineTo(x + 9, y + 1.5)
    .stroke();
  doc.restore();
}

function drawGlobeIcon(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  color: string,
) {
  doc.save();
  doc.lineWidth(1.1).strokeColor(color);
  doc.circle(x + 4.5, y + 4.5, 4).stroke();
  doc.moveTo(x + 0.5, y + 4.5).lineTo(x + 8.5, y + 4.5).stroke();
  doc
    .moveTo(x + 4.5, y + 0.5)
    .bezierCurveTo(x + 1.5, y + 2, x + 1.5, y + 7, x + 4.5, y + 8.5)
    .stroke();
  doc
    .moveTo(x + 4.5, y + 0.5)
    .bezierCurveTo(x + 7.5, y + 2, x + 7.5, y + 7, x + 4.5, y + 8.5)
    .stroke();
  doc.restore();
}

function registerFonts(doc: PDFKit.PDFDocument) {
  const regular = fontPath('NotoSans-Regular.ttf');
  const bold = fontPath('NotoSans-Bold.ttf');
  if (!existsSync(regular) || !existsSync(bold)) {
    throw new Error(
      'Invoice fonts missing. Expected assets/fonts/NotoSans-Regular.ttf and NotoSans-Bold.ttf',
    );
  }
  doc.registerFont('Invoice', regular);
  doc.registerFont('Invoice-Bold', bold);
}

export async function buildMembershipInvoicePdf(
  input: InvoicePdfInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Invoice ${input.invoiceNo}`,
        Author: COMPANY.name,
        Creator: COMPANY.name,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      registerFonts(doc);
      drawInvoice(doc, input);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Fixed vertical bands so the invoice always fills the A4 page
 * (matches the design mockup — no empty bottom void).
 */
function drawInvoice(doc: PDFKit.PDFDocument, input: InvoicePdfInput) {
  const right = PAGE_W - MARGIN_X;
  const contentW = right - MARGIN_X;
  const mark = currencyMark(input.currency);

  // ========== HEADER ==========
  const headerTop = 16;
  const logoFile = logoPath();
  const logoH = 68;
  let logoW = logoH * (640 / 249);

  const contactX = Math.max(MARGIN_X + logoW + 12, PAGE_W - MARGIN_X - 270);
  let cy = headerTop;
  const contactLine = (
    drawIcon: (d: PDFKit.PDFDocument, x: number, y: number, c: string) => void,
    text: string,
  ) => {
    drawIcon(doc, contactX, cy + 1, NAVY_SOFT);
    doc
      .font('Invoice')
      .fontSize(10)
      .fillColor(MUTED)
      .text(text, contactX + 14, cy, {
        width: right - contactX - 14,
        align: 'left',
        lineGap: 0,
      });
    cy = doc.y + 2;
  };
  contactLine(drawPinIcon, COMPANY.address);
  contactLine(drawPhoneIcon, COMPANY.phone);
  contactLine(drawMailIcon, COMPANY.email);
  contactLine(drawGlobeIcon, COMPANY.website);

  // Vertically center the logo within the header contact block height.
  const headerBandH = Math.max(logoH, cy - headerTop);
  const logoY = headerTop + (headerBandH - logoH) / 2;
  if (existsSync(logoFile)) {
    doc.image(logoFile, MARGIN_X, logoY, { height: logoH });
    logoW = logoH * (640 / 249);
  }

  const headerRuleY = headerTop + headerBandH + 10;
  doc
    .moveTo(MARGIN_X, headerRuleY)
    .lineTo(right, headerRuleY)
    .lineWidth(1.2)
    .strokeColor(RULE)
    .stroke();

  // ========== FULL-WIDTH INVOICE BANNER (matches design) ==========
  const bannerY = headerRuleY + 18;
  const bannerH = 72;
  doc.rect(MARGIN_X, bannerY, contentW, bannerH).fill(LIGHT_BLUE);

  doc
    .font('Invoice-Bold')
    .fontSize(34)
    .fillColor(NAVY)
    .text('INVOICE', MARGIN_X + 16, bannerY + 20, { lineBreak: false });

  const metaX = right - 230;
  const metaLabelW = 108;
  const metaValueX = metaX + metaLabelW + 8;
  const metaRow = (
    label: string,
    value: string,
    rowY: number,
    valueBold = false,
  ) => {
    doc
      .font('Invoice')
      .fontSize(11)
      .fillColor(NAVY)
      .text(label, metaX, rowY, { lineBreak: false });
    doc
      .font(valueBold ? 'Invoice-Bold' : 'Invoice')
      .fontSize(11)
      .fillColor(NAVY)
      .text(value, metaValueX, rowY, { lineBreak: false });
  };
  metaRow('Invoice No.', input.invoiceNo, bannerY + 12, true);
  metaRow(`Invoice Date`, formatDate(input.issuedAt), bannerY + 32);
  metaRow('Payment Status', 'Paid', bannerY + 52, true);

  // ========== BILL TO ==========
  let y = bannerY + bannerH + 28;
  const sectionLeft = MARGIN_X + 12;
  doc
    .font('Invoice-Bold')
    .fontSize(15)
    .fillColor(NAVY)
    .text('Bill To', sectionLeft, y);
  y += 24;

  const billLabelW = 78;
  const billValueX = sectionLeft + billLabelW + 18;
  const billRow = (label: string, value: string) => {
    doc
      .font('Invoice')
      .fontSize(12)
      .fillColor(MUTED)
      .text(label, sectionLeft, y, { lineBreak: false });
    doc
      .font('Invoice')
      .fontSize(12)
      .fillColor(NAVY)
      .text(value, billValueX, y, {
        width: contentW - (billValueX - MARGIN_X),
        lineBreak: false,
      });
    y += 24;
  };

  billRow('Name', input.memberName);
  if (input.memberEmail) billRow('Email', input.memberEmail);
  if (input.memberMobile) billRow('Mobile', input.memberMobile);
  if (input.memberLocation) {
    billRow(input.isInternational ? 'Country' : 'State', input.memberLocation);
  }

  y += 20;

  // ========== LINE ITEMS TABLE (thin bordered grid) ==========
  const tableX = MARGIN_X;
  const tableW = contentW;
  const colDescW = 250;
  const colQtyW = 52;
  const colUnitW = 120;
  const colAmtW = tableW - colDescW - colQtyW - colUnitW;
  const xQty = tableX + colDescW;
  const xUnit = xQty + colQtyW;
  const xAmt = xUnit + colUnitW;

  const headH = 40;
  const itemH = 84;
  const sumH = 34;
  const totalH = 44;
  const unitStr = formatMoney(input.listPricePaise, input.currency);
  const discLabel = input.discountLabel
    ? `Discount (${input.discountLabel})`
    : 'Discount';
  const discValue =
    input.discountPaise > 0
      ? `-${formatMoney(input.discountPaise, input.currency)}`
      : formatMoney(0, input.currency);

  const tableH = headH + itemH + sumH + sumH + totalH;
  const tableTop = y;

  // Outer border + header fill
  doc.rect(tableX, tableTop, tableW, headH).fill(LIGHT_BLUE);
  doc
    .rect(tableX, tableTop + headH + itemH + sumH + sumH, tableW, totalH)
    .fill(LIGHT_BLUE);

  // Thin grid
  doc.lineWidth(0.7).strokeColor(TABLE_LINE);
  doc.rect(tableX, tableTop, tableW, tableH).stroke();
  // Horizontal rules
  let ruleY = tableTop + headH;
  doc.moveTo(tableX, ruleY).lineTo(tableX + tableW, ruleY).stroke();
  ruleY += itemH;
  doc.moveTo(tableX, ruleY).lineTo(tableX + tableW, ruleY).stroke();
  ruleY += sumH;
  doc.moveTo(tableX, ruleY).lineTo(tableX + tableW, ruleY).stroke();
  ruleY += sumH;
  doc.moveTo(tableX, ruleY).lineTo(tableX + tableW, ruleY).stroke();
  // Vertical rules (header + item row only — summary rows span)
  const vBottom = tableTop + headH + itemH;
  for (const vx of [xQty, xUnit, xAmt]) {
    doc.moveTo(vx, tableTop).lineTo(vx, vBottom).stroke();
  }
  // Amount column vertical for summary/total rows
  doc
    .moveTo(xAmt, tableTop + headH + itemH)
    .lineTo(xAmt, tableTop + tableH)
    .stroke();

  // Header labels
  const htY = tableTop + 13;
  doc.font('Invoice-Bold').fontSize(12).fillColor(NAVY);
  doc.text('Description', tableX + 12, htY, { lineBreak: false });
  doc.text('Qty', xQty, htY, {
    width: colQtyW,
    align: 'center',
    lineBreak: false,
  });
  doc.text(`Unit Price (${mark})`, xUnit, htY, {
    width: colUnitW,
    align: 'center',
    lineBreak: false,
  });
  doc.text(`Amount (${mark})`, xAmt, htY, {
    width: colAmtW,
    align: 'center',
    lineBreak: false,
  });

  // Item row
  const itemTop = tableTop + headH;
  doc
    .font('Invoice-Bold')
    .fontSize(13)
    .fillColor(NAVY)
    .text(input.planName, tableX + 12, itemTop + 16, {
      width: colDescW - 18,
      lineBreak: false,
    });
  doc
    .font('Invoice')
    .fontSize(11)
    .fillColor(MUTED)
    .text(
      `Start Date: ${formatDate(input.startsAt)}`,
      tableX + 12,
      itemTop + 38,
      { width: colDescW - 18 },
    );
  doc.text(`End Date: ${formatDate(input.endsAt)}`, tableX + 12, itemTop + 54, {
    width: colDescW - 18,
  });

  const itemMidY = itemTop + 34;
  doc.font('Invoice').fontSize(12).fillColor(NAVY);
  doc.text('1', xQty, itemMidY, {
    width: colQtyW,
    align: 'center',
    lineBreak: false,
  });
  doc.text(unitStr, xUnit, itemMidY, {
    width: colUnitW,
    align: 'center',
    lineBreak: false,
  });
  doc.text(unitStr, xAmt, itemMidY, {
    width: colAmtW,
    align: 'center',
    lineBreak: false,
  });

  // Subtotal row
  let sumY = itemTop + itemH;
  doc
    .font('Invoice')
    .fontSize(12)
    .fillColor(NAVY)
    .text('Subtotal', tableX + 12, sumY + 10, { lineBreak: false });
  doc.text(
    formatMoney(input.listPricePaise, input.currency),
    xAmt,
    sumY + 10,
    {
      width: colAmtW,
      align: 'center',
      lineBreak: false,
    },
  );

  // Discount row
  sumY += sumH;
  doc.text(discLabel, tableX + 12, sumY + 10, { lineBreak: false });
  doc.text(discValue, xAmt, sumY + 10, {
    width: colAmtW,
    align: 'center',
    lineBreak: false,
  });

  // Total row
  sumY += sumH;
  doc
    .font('Invoice-Bold')
    .fontSize(13)
    .fillColor(NAVY)
    .text(`Total Amount Paid (${mark})`, tableX + 12, sumY + 14, {
      lineBreak: false,
    });
  doc
    .font('Invoice-Bold')
    .fontSize(16)
    .text(
      formatMoney(input.amountPaidPaise, input.currency),
      xAmt,
      sumY + 12,
      { width: colAmtW, align: 'center', lineBreak: false },
    );

  y = tableTop + tableH + 30;

  // ========== PAYMENT DETAILS ==========
  doc
    .font('Invoice-Bold')
    .fontSize(15)
    .fillColor(NAVY)
    .text('Payment Details', sectionLeft, y);
  y += 26;

  const payLabelW = 168;
  const payValueX = sectionLeft + payLabelW + 16;
  const payRow = (label: string, value: string) => {
    doc
      .font('Invoice')
      .fontSize(12)
      .fillColor(MUTED)
      .text(label, sectionLeft, y, { lineBreak: false });
    doc
      .font('Invoice')
      .fontSize(12)
      .fillColor(NAVY)
      .text(value, payValueX, y, {
        width: contentW - (payValueX - MARGIN_X),
        lineBreak: false,
      });
    y += 24;
  };

  payRow('Payment Method', input.paymentMethod);
  payRow('Payment Transaction ID', input.paymentRef?.trim() || 'N/A');
  payRow(
    'Payment Date',
    formatPaymentDate(input.paidAt, input.isInternational),
  );

  // ========== GST then thank-you, with bottom page margin ==========
  const gstH = 30;
  const bottomPad = 66;
  const gapPayToGst = 28;
  const gapGstToRule = 16;
  const gapRuleToThanks = 12;
  const thanksLineH = 16;
  const stackH = gstH + gapGstToRule + gapRuleToThanks + thanksLineH;

  let footerY = y + gapPayToGst;
  const maxGstY = PAGE_H - bottomPad - stackH;
  if (footerY > maxGstY && maxGstY >= y + 20) {
    // Pull footer up only enough to keep bottom margin; never into payment rows.
    footerY = maxGstY;
  }

  doc.rect(MARGIN_X, footerY, contentW, gstH).fill(GREY_BOX);
  doc
    .font('Invoice')
    .fontSize(10)
    .fillColor(MUTED)
    .text(
      'GST is not applicable to this invoice under the applicable GST threshold provisions.',
      MARGIN_X + 14,
      footerY + 9,
      { width: contentW - 28, lineBreak: false },
    );

  const footerRuleY = footerY + gstH + gapGstToRule;
  doc
    .moveTo(MARGIN_X, footerRuleY)
    .lineTo(right, footerRuleY)
    .lineWidth(1.2)
    .strokeColor(RULE)
    .stroke();
  doc
    .font('Invoice')
    .fontSize(11)
    .fillColor(MUTED)
    .text(
      'Thank you for choosing The Healing Mat.',
      MARGIN_X,
      footerRuleY + gapRuleToThanks,
      {
        width: contentW,
        align: 'center',
      },
    );
}
