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
const LIGHT_BLUE = '#C5D9EB';
const GREY_BOX = '#E6E6E6';
const MUTED = '#4A5A6A';
const RULE = '#1A365D';
const TABLE_LINE = '#9BB4C9';

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
  const logoFile = logoPath();
  const logoH = 56;
  const logoY = 30;
  let logoW = 145;
  if (existsSync(logoFile)) {
    doc.image(logoFile, MARGIN_X, logoY, { height: logoH });
    logoW = logoH * (640 / 249);
  }

  const contactX = Math.max(MARGIN_X + logoW + 20, PAGE_W - MARGIN_X - 260);
  let cy = 32;
  const contactLine = (
    drawIcon: (d: PDFKit.PDFDocument, x: number, y: number, c: string) => void,
    text: string,
  ) => {
    drawIcon(doc, contactX, cy + 1, NAVY_SOFT);
    doc
      .font('Invoice')
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(text, contactX + 14, cy, {
        width: right - contactX - 14,
        align: 'left',
        lineGap: 1,
      });
    cy = doc.y + 3;
  };
  contactLine(drawPinIcon, COMPANY.address);
  contactLine(drawPhoneIcon, COMPANY.phone);
  contactLine(drawMailIcon, COMPANY.email);
  contactLine(drawGlobeIcon, COMPANY.website);

  const headerRuleY = Math.max(logoY + logoH + 16, cy + 10);
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

  const metaX = right - 220;
  doc.font('Invoice').fontSize(11).fillColor(NAVY);
  doc.text('Invoice No.: ', metaX, bannerY + 12, {
    continued: true,
    lineBreak: false,
  });
  doc.font('Invoice-Bold').text(input.invoiceNo, { lineBreak: false });

  doc
    .font('Invoice')
    .fontSize(11)
    .fillColor(NAVY)
    .text(`Invoice Date: ${formatDate(input.issuedAt)}`, metaX, bannerY + 32, {
      lineBreak: false,
    });

  doc.font('Invoice').fontSize(11).fillColor(NAVY);
  doc.text('Payment Status: ', metaX, bannerY + 52, {
    continued: true,
    lineBreak: false,
  });
  doc.font('Invoice-Bold').text('Paid', { lineBreak: false });

  // ========== BILL TO ==========
  let y = bannerY + bannerH + 28;
  doc
    .font('Invoice-Bold')
    .fontSize(15)
    .fillColor(NAVY)
    .text('Bill To', MARGIN_X, y);
  y += 22;

  const billRow = (label: string, value: string) => {
    doc.font('Invoice').fontSize(12).fillColor(NAVY);
    doc.text(`${label}: `, MARGIN_X, y, { continued: true, lineBreak: false });
    doc.font('Invoice-Bold').text(value, { lineBreak: false });
    y += 20;
  };

  billRow('Name', input.memberName);
  if (input.memberEmail) billRow('Email', input.memberEmail);
  if (input.memberMobile) billRow('Mobile', input.memberMobile);
  if (input.memberLocation) {
    billRow(input.isInternational ? 'Country' : 'State', input.memberLocation);
  }

  y += 18;

  // ========== TABLE ==========
  const colQtyR = MARGIN_X + 300;
  const colUnitR = MARGIN_X + 405;
  const colAmtR = right - 10;
  const headH = 28;
  doc.rect(MARGIN_X, y, contentW, headH).fill(LIGHT_BLUE);
  const htY = y + 8;
  doc.font('Invoice-Bold').fontSize(11).fillColor(NAVY);
  doc.text('Description', MARGIN_X + 12, htY, { lineBreak: false });
  doc.text('Qty', colQtyR - 36, htY, {
    width: 36,
    align: 'right',
    lineBreak: false,
  });
  doc.text(`Unit Price (${mark})`, colUnitR - 110, htY, {
    width: 110,
    align: 'right',
    lineBreak: false,
  });
  doc.text(`Amount (${mark})`, colAmtR - 100, htY, {
    width: 100,
    align: 'right',
    lineBreak: false,
  });

  y += headH;
  doc
    .moveTo(MARGIN_X, y)
    .lineTo(right, y)
    .lineWidth(0.8)
    .strokeColor(TABLE_LINE)
    .stroke();

  const rowTop = y;
  const rowH = 64;
  y += 14;
  doc
    .font('Invoice-Bold')
    .fontSize(13)
    .fillColor(NAVY)
    .text(input.planName, MARGIN_X + 12, y, { lineBreak: false });
  y += 18;
  doc
    .font('Invoice')
    .fontSize(10)
    .fillColor(MUTED)
    .text(`Start Date: ${formatDate(input.startsAt)}`, MARGIN_X + 12, y);
  y += 15;
  doc.text(`End Date: ${formatDate(input.endsAt)}`, MARGIN_X + 12, y);

  const midY = rowTop + 26;
  const unitStr = formatMoney(input.listPricePaise, input.currency);
  doc.font('Invoice').fontSize(12).fillColor(NAVY);
  doc.text('1', colQtyR - 36, midY, {
    width: 36,
    align: 'right',
    lineBreak: false,
  });
  doc.text(unitStr, colUnitR - 110, midY, {
    width: 110,
    align: 'right',
    lineBreak: false,
  });
  doc.text(unitStr, colAmtR - 100, midY, {
    width: 100,
    align: 'right',
    lineBreak: false,
  });

  y = rowTop + rowH;
  doc
    .moveTo(MARGIN_X, y)
    .lineTo(right, y)
    .lineWidth(0.8)
    .strokeColor(TABLE_LINE)
    .stroke();

  // ========== TOTALS ==========
  const totalsX = MARGIN_X + 280;
  y += 20;
  doc.font('Invoice').fontSize(12).fillColor(NAVY);
  doc.text('Subtotal', totalsX, y, { lineBreak: false });
  doc.text(formatMoney(input.listPricePaise, input.currency), colAmtR - 100, y, {
    width: 100,
    align: 'right',
    lineBreak: false,
  });

  y += 20;
  const discLabel = input.discountLabel
    ? `Discount (${input.discountLabel})`
    : 'Discount';
  const discValue =
    input.discountPaise > 0
      ? `-${formatMoney(input.discountPaise, input.currency)}`
      : formatMoney(0, input.currency);
  doc.text(discLabel, totalsX, y, { lineBreak: false });
  doc.text(discValue, colAmtR - 100, y, {
    width: 100,
    align: 'right',
    lineBreak: false,
  });

  y += 22;
  const totalH = 36;
  doc.rect(MARGIN_X, y - 6, contentW, totalH).fill(LIGHT_BLUE);
  doc
    .font('Invoice-Bold')
    .fontSize(13)
    .fillColor(NAVY)
    .text(`Total Amount Paid (${mark})`, totalsX, y + 4, { lineBreak: false });
  doc
    .font('Invoice-Bold')
    .fontSize(18)
    .text(
      formatMoney(input.amountPaidPaise, input.currency),
      colAmtR - 110,
      y + 2,
      { width: 110, align: 'right', lineBreak: false },
    );

  // ========== PAYMENT DETAILS ==========
  y += totalH + 28;
  doc
    .font('Invoice-Bold')
    .fontSize(15)
    .fillColor(NAVY)
    .text('Payment Details', MARGIN_X, y);
  y += 22;
  doc.font('Invoice').fontSize(12).fillColor(NAVY);
  doc.text(`Payment Method: ${input.paymentMethod}`, MARGIN_X, y);
  y += 18;
  doc.text(
    `Payment Transaction ID: ${input.paymentRef?.trim() || 'N/A'}`,
    MARGIN_X,
    y,
  );
  y += 18;
  doc.text(
    `Payment Date: ${formatPaymentDate(input.paidAt, input.isInternational)}`,
    MARGIN_X,
    y,
  );

  // ========== GST + FOOTER pinned to page bottom ==========
  const footerLineY = PAGE_H - 48;
  const gstH = 32;
  const gstY = footerLineY - gstH - 28;

  // If content ended early, GST still sits above the footer (fills the page).
  const contentEnd = y + 24;
  const gstDrawY = Math.max(contentEnd, gstY);

  doc.rect(MARGIN_X, gstDrawY, contentW, gstH).fill(GREY_BOX);
  doc
    .font('Invoice')
    .fontSize(10)
    .fillColor(MUTED)
    .text(
      'GST is not applicable to this invoice under the applicable GST threshold provisions.',
      MARGIN_X + 14,
      gstDrawY + 10,
      { width: contentW - 28, lineBreak: false },
    );

  doc
    .moveTo(MARGIN_X, footerLineY)
    .lineTo(right, footerLineY)
    .lineWidth(1.2)
    .strokeColor(RULE)
    .stroke();
  doc
    .font('Invoice')
    .fontSize(11)
    .fillColor(MUTED)
    .text('Thank you for choosing The Healing Mat.', MARGIN_X, footerLineY + 12, {
      width: contentW,
      align: 'center',
    });
}
