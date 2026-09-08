/**
 * Minimal single-page PDF invoice (Helvetica) — no external PDF dependency.
 */

export type InvoicePdfInput = {
  invoiceNo: string;
  issuedAt: Date;
  memberName: string;
  memberEmail: string | null;
  memberMobile: string | null;
  planName: string;
  planMonths: number;
  listPricePaise: number;
  discountPaise: number;
  amountPaidPaise: number;
  paymentRef: string | null;
  startsAt: Date;
  endsAt: Date;
};

function pdfEscape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function formatInr(paise: number) {
  const rupees = Math.round(paise / 100);
  return `INR ${rupees.toLocaleString('en-IN')}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function buildMembershipInvoicePdf(input: InvoicePdfInput): Buffer {
  const lines: { text: string; size?: number; gap?: number }[] = [
    { text: 'The Healing Mat', size: 18, gap: 22 },
    { text: 'Membership Invoice / Receipt', size: 12, gap: 18 },
    { text: `Invoice No: ${input.invoiceNo}`, size: 10, gap: 14 },
    { text: `Date: ${formatDate(input.issuedAt)}`, size: 10, gap: 18 },
    { text: 'Billed To', size: 11, gap: 14 },
    { text: input.memberName, size: 10, gap: 13 },
  ];

  if (input.memberEmail) {
    lines.push({ text: input.memberEmail, size: 10, gap: 13 });
  }
  if (input.memberMobile) {
    lines.push({ text: input.memberMobile, size: 10, gap: 13 });
  }

  lines.push(
    { text: ' ', size: 8, gap: 10 },
    { text: 'Membership Details', size: 11, gap: 14 },
    { text: `Plan: ${input.planName}`, size: 10, gap: 13 },
    { text: `Duration: ${input.planMonths} months`, size: 10, gap: 13 },
    {
      text: `Validity: ${formatDate(input.startsAt)} - ${formatDate(input.endsAt)}`,
      size: 10,
      gap: 13,
    },
    { text: `List price: ${formatInr(input.listPricePaise)}`, size: 10, gap: 13 },
    {
      text: `Discount: ${input.discountPaise > 0 ? formatInr(input.discountPaise) : 'None'}`,
      size: 10,
      gap: 13,
    },
    { text: `Amount paid: ${formatInr(input.amountPaidPaise)}`, size: 10, gap: 13 },
    {
      text: `Payment ref: ${input.paymentRef || 'N/A'}`,
      size: 10,
      gap: 18,
    },
    {
      text: 'Thank you for joining The Healing Mat.',
      size: 10,
      gap: 14,
    },
    {
      text: 'This is a computer-generated receipt.',
      size: 9,
      gap: 12,
    },
  );

  let y = 780;
  const ops: string[] = ['BT', '/F1 12 Tf', '50 780 Td'];
  let first = true;

  for (const line of lines) {
    const size = line.size ?? 10;
    const gap = line.gap ?? 14;
    if (!first) {
      ops.push(`0 -${gap} Td`);
      y -= gap;
    }
    first = false;
    ops.push(`/F1 ${size} Tf`);
    ops.push(`(${pdfEscape(line.text)}) Tj`);
  }
  ops.push('ET');

  const stream = ops.join('\n');
  const objects: string[] = [];
  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj');
  objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj');
  objects.push(
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj',
  );
  objects.push(
    `4 0 obj<< /Length ${Buffer.byteLength(stream, 'utf8')} >>stream\n${stream}\nendstream\nendobj`,
  );
  objects.push('5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${obj}\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}
