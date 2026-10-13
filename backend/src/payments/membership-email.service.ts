import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { buildMemberAccessLink } from '../common/frontend-url';
import { sendResendEmail } from '../mail/resend';
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
      const frontendBase = resolveFrontendBase(
        this.config.get<string>('FRONTEND_URL'),
      );
      const invoicePdfUrl = this.membershipWhatsApp.buildPublicInvoiceUrl(
        invoice.id,
      );
      const permanentSessionLink = user.accessLinkToken
        ? buildMemberAccessLink(
            this.config.get<string>('FRONTEND_URL'),
            user.accessLinkToken,
          )
        : null;
      const memberArea = `${frontendBase}/dashboard`;
      const inviteFriend = `${frontendBase}/dashboard/refer`;
      const supportEmail = 'hello@thehealingmat.yoga';

      const firstName = user.fullName?.trim().split(/\s+/)[0] || 'there';
      const currency = (membership.currency || 'INR').toUpperCase();
      const amountPaid = formatAmountOnly(
        membership.amountPaidPaise,
        membership.currency,
      );
      const startDate = formatLongDate(membership.startsAt);
      const endDate = formatLongDate(membership.endsAt);

      const text = [
        `Hi ${firstName},`,
        '',
        'Thank you for your payment. Your The Healing Mat membership is now active!',
        '',
        "We're happy to be part of your journey towards better health and everyday well-being.",
        '',
        'Your Membership Details',
        `Plan: ${membership.planName}`,
        `Amount Paid: ${currency} ${amountPaid}`,
        `Invoice Number: ${invoice.invoiceNumber}`,
        `Membership Period: ${startDate} – ${endDate}`,
        '',
        'Your Invoice',
        'You can download your invoice using the link below. A copy is also attached to this email for your records.',
        '',
        `Download Your Invoice (PDF): ${invoicePdfUrl}`,
        '',
        'Access Your Daily Yoga Classes',
        permanentSessionLink
          ? [
              'Your permanent session access link is:',
              '',
              permanentSessionLink,
              '',
              'Please bookmark this link so you can easily access your daily yoga classes whenever a session is scheduled.',
              '',
            ].join('\n')
          : '',
        'You can also visit your member area to access the facilities available with your membership.',
        '',
        `Open My Member Area: ${memberArea}`,
        '',
        'Share the Gift of Everyday Health',
        'Know someone who would enjoy simple, guided yoga for everyday health?',
        '',
        'You can invite your friends and family to experience The Healing Mat through our 14-day free yoga trial.',
        '',
        `Invite a Friend: ${inviteFriend}`,
        '',
        'We believe that taking care of our health becomes easier when we encourage one another.',
        '',
        'Thank you for choosing The Healing Mat. We look forward to supporting you on your journey towards a healthier, more balanced everyday life.',
        '',
        'Warm regards,',
        'Team The Healing Mat',
        'Health Without Drama',
        '',
        `Need help with your membership or accessing your classes? Contact us at ${supportEmail}.`,
      ]
        .filter((line) => line !== '')
        .join('\n');

      const html = `
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Thank you for your payment. Your <strong>The Healing Mat</strong> membership is now active!</p>
        <p>We're happy to be part of your journey towards better health and everyday well-being.</p>

        <h2 style="font-size:16px;margin:24px 0 8px;color:#243028;">Your Membership Details</h2>
        <p style="margin:0 0 16px;">
          <strong>Plan:</strong> ${escapeHtml(membership.planName)}<br />
          <strong>Amount Paid:</strong> ${escapeHtml(currency)} ${escapeHtml(amountPaid)}<br />
          <strong>Invoice Number:</strong> ${escapeHtml(invoice.invoiceNumber)}<br />
          <strong>Membership Period:</strong> ${escapeHtml(startDate)} – ${escapeHtml(endDate)}
        </p>

        <h2 style="font-size:16px;margin:24px 0 8px;color:#243028;">Your Invoice</h2>
        <p>You can download your invoice using the link below. A copy is also attached to this email for your records.</p>
        <p><a href="${escapeHtml(invoicePdfUrl)}">Download Your Invoice (PDF)</a></p>

        <h2 style="font-size:16px;margin:24px 0 8px;color:#243028;">Access Your Daily Yoga Classes</h2>
        ${
          permanentSessionLink
            ? `<p>Your permanent session access link is:</p>
        <p><a href="${escapeHtml(permanentSessionLink)}">${escapeHtml(permanentSessionLink)}</a></p>
        <p>Please bookmark this link so you can easily access your daily yoga classes whenever a session is scheduled.</p>`
            : ''
        }
        <p>You can also visit your member area to access the facilities available with your membership.</p>
        <p><a href="${escapeHtml(memberArea)}">Open My Member Area</a></p>

        <h2 style="font-size:16px;margin:24px 0 8px;color:#243028;">Share the Gift of Everyday Health</h2>
        <p>Know someone who would enjoy simple, guided yoga for everyday health?</p>
        <p>You can invite your friends and family to experience The Healing Mat through our 14-day free yoga trial.</p>
        <p><a href="${escapeHtml(inviteFriend)}">Invite a Friend</a></p>
        <p>We believe that taking care of our health becomes easier when we encourage one another.</p>

        <p>Thank you for choosing The Healing Mat. We look forward to supporting you on your journey towards a healthier, more balanced everyday life.</p>

        <p>
          Warm regards,<br />
          Team The Healing Mat<br />
          <em>Health Without Drama</em>
        </p>

        <p style="color:#5f6f64;font-size:13px;">
          Need help with your membership or accessing your classes? Contact us at
          <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.
        </p>
      `;

      await sendResendEmail({
        apiKey,
        from,
        to: email,
        subject: `Your The Healing Mat membership is now active — ${membership.planName}`,
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

function formatAmountOnly(minor: number, currency: string | null | undefined) {
  if ((currency || 'INR').toUpperCase() === 'USD') {
    return (Math.max(0, minor) / 100).toFixed(2);
  }
  return Math.round(Math.max(0, minor) / 100).toLocaleString('en-IN');
}

function formatLongDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
