import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { buildMemberAccessLink } from '../common/frontend-url';
import { sendResendEmail } from '../mail/resend';
import { Region } from '../users/enums/region.enum';
import { User } from '../users/user.entity';
import { Invoice } from './invoice.entity';
import { Membership } from './membership.entity';
import { MembershipWhatsAppService } from './membership-whatsapp.service';

/**
 * Emails membership confirmation with invoice PDF + permanent /u/{slug} link.
 * Primary channel for Outside India / USD members (WhatsApp is India-only).
 */
@Injectable()
export class MembershipEmailService {
  private readonly logger = new Logger(MembershipEmailService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly membershipWhatsApp: MembershipWhatsAppService,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
  ) {}

  async sendMembershipPurchaseConfirm(input: {
    user: User;
    membership: Membership;
    invoice: Invoice;
    pdf: Buffer;
    filename: string;
  }): Promise<void> {
    const { user, membership, invoice, pdf, filename } = input;
    if (membership.amountPaidPaise <= 0) return;

    const email = user.email?.trim();
    if (!email) {
      this.logger.log(
        `[membership-email] Skipped for ${membership.id}: no email on account`,
      );
      return;
    }

    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from =
      this.config.get<string>('RESEND_FROM_EMAIL')?.trim() ||
      'The Healing Mat <onboarding@resend.dev>';
    if (!apiKey) {
      this.logger.log(
        `[membership-email] Skipped for ${membership.id}: RESEND_API_KEY not set`,
      );
      return;
    }

    const claim = await this.invoices.update(
      { id: invoice.id, membershipEmailSentAt: IsNull() },
      { membershipEmailSentAt: new Date() },
    );
    if (!claim.affected) return;

    try {
      const invoicePdfUrl = this.membershipWhatsApp.buildPublicInvoiceUrl(
        invoice.id,
      );
      const permanentSessionLink = user.accessLinkToken
        ? buildMemberAccessLink(
            this.config.get<string>('FRONTEND_URL'),
            user.accessLinkToken,
          )
        : null;
      const memberArea = `${resolveFrontendBase(
        this.config.get<string>('FRONTEND_URL'),
      )}/dashboard`;

      const firstName = user.fullName?.trim().split(/\s+/)[0] || 'there';
      const amount = formatPaidAmount(
        membership.amountPaidPaise,
        membership.currency,
      );
      const validity = formatDateRange(membership.startsAt, membership.endsAt);
      const isInternational = user.region === Region.OutsideIndia;

      const text = [
        `Hi ${firstName},`,
        '',
        'Thank you for your payment. Your The Healing Mat membership is active.',
        '',
        `Plan: ${membership.planName}`,
        `Amount paid: ${amount}`,
        `Invoice number: ${invoice.invoiceNumber}`,
        `Membership period: ${validity}`,
        '',
        `Download your invoice (PDF):`,
        invoicePdfUrl,
        '(A copy is also attached to this email.)',
        '',
        permanentSessionLink
          ? [
              'Your permanent session access link (bookmark this):',
              permanentSessionLink,
              '',
              'Use this link anytime to join your live class when a session is running.',
              '',
            ].join('\n')
          : '',
        `Member area: ${memberArea}`,
        '',
        isInternational
          ? 'This email confirms your international membership purchase and invoice.'
          : '',
        '',
        '— The Healing Mat',
      ]
        .filter((line) => line !== '')
        .join('\n');

      const html = `
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Thank you for your payment. Your <strong>The Healing Mat</strong> membership is active.</p>
        <p>
          <strong>Plan:</strong> ${escapeHtml(membership.planName)}<br />
          <strong>Amount paid:</strong> ${escapeHtml(amount)}<br />
          <strong>Invoice number:</strong> ${escapeHtml(invoice.invoiceNumber)}<br />
          <strong>Membership period:</strong> ${escapeHtml(validity)}
        </p>
        <p>
          <a href="${escapeHtml(invoicePdfUrl)}">Download your invoice (PDF)</a><br />
          <span style="color:#5f6f64;font-size:13px;">A copy is also attached to this email.</span>
        </p>
        ${
          permanentSessionLink
            ? `<p>
          <strong>Your permanent session access link</strong> (please bookmark):<br />
          <a href="${escapeHtml(permanentSessionLink)}">${escapeHtml(permanentSessionLink)}</a><br />
          <span style="color:#5f6f64;font-size:13px;">Use this link anytime to join your live class when a session is running.</span>
        </p>`
            : ''
        }
        <p><a href="${escapeHtml(memberArea)}">Open member area</a></p>
        <p>— The Healing Mat</p>
      `;

      await sendResendEmail({
        apiKey,
        from,
        to: email,
        subject: `Your Healing Mat membership & invoice — ${membership.planName}`,
        text,
        html,
        attachments: [
          {
            filename,
            content: pdf.toString('base64'),
          },
        ],
      });

      this.logger.log(
        `[membership-email] Sent to ${email} for membership ${membership.id} (invoice ${invoice.invoiceNumber})`,
      );
    } catch (err) {
      await this.invoices.update(
        { id: invoice.id },
        { membershipEmailSentAt: null },
      );
      throw err;
    }
  }
}

function resolveFrontendBase(raw: string | undefined): string {
  const parts = (raw ?? 'http://localhost:3000')
    .split(',')
    .map((part) => part.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (parts.length === 0) return 'http://localhost:3000';
  const publicUrl = parts.find((url) => !/localhost|127\.0\.0\.1/i.test(url));
  return publicUrl ?? parts[0];
}

function formatPaidAmount(minor: number, currency: string | null | undefined) {
  if ((currency || 'INR').toUpperCase() === 'USD') {
    return `$${(Math.max(0, minor) / 100).toFixed(2)}`;
  }
  return `₹${Math.round(Math.max(0, minor) / 100).toLocaleString('en-IN')}`;
}

function formatDateRange(startsAt: Date, endsAt: Date) {
  const fmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${fmt.format(startsAt)} – ${fmt.format(endsAt)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
