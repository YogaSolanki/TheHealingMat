import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { sendAiSensyCampaign } from '../sms/aisensy-whatsapp';
import { Region } from '../users/enums/region.enum';
import { User } from '../users/user.entity';
import { Invoice } from './invoice.entity';
import { Membership } from './membership.entity';

@Injectable()
export class MembershipWhatsAppService {
  private readonly logger = new Logger(MembershipWhatsAppService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
  ) {}

  buildPublicInvoiceUrl(invoiceId: string): string {
    const apiBase =
      this.config.get<string>('API_PUBLIC_URL')?.replace(/\/$/, '') ||
      'http://localhost:4000/api';
    const token = this.signInvoiceDownloadToken(invoiceId);
    return `${apiBase}/invoices/public/${invoiceId}?token=${encodeURIComponent(token)}`;
  }

  verifyInvoiceDownloadToken(invoiceId: string, token: string): boolean {
    const trimmed = token.trim();
    const dot = trimmed.indexOf('.');
    if (dot <= 0) return false;
    const expStr = trimmed.slice(0, dot);
    const sig = trimmed.slice(dot + 1);
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    const secret = this.config.get<string>('JWT_SECRET')?.trim();
    if (!secret) return false;
    const expected = createHmac('sha256', secret)
      .update(`${invoiceId}.${expStr}`)
      .digest('base64url');
    try {
      const left = Buffer.from(sig);
      const right = Buffer.from(expected);
      return left.length === right.length && timingSafeEqual(left, right);
    } catch {
      return false;
    }
  }

  /**
   * AiSensy app_membership_confirm — paid membership only (not free trial).
   */
  async sendMembershipPurchaseConfirm(
    user: User,
    membership: Membership,
    invoice: Invoice,
  ): Promise<void> {
    if (membership.amountPaidPaise <= 0) return;
    if (user.region !== Region.India) return;
    const mobile = user.mobile?.trim();
    if (!mobile) return;

    const currency = (membership.currency || 'INR').toUpperCase();
    if (currency !== 'INR') return;

    const apiKey = this.config.get<string>('AISENSY_API_KEY')?.trim();
    const campaignName =
      this.config
        .get<string>('AISENSY_MEMBERSHIP_CONFIRM_CAMPAIGN_NAME')
        ?.trim() || 'app_membership_confirm';

    if (!apiKey || !campaignName) {
      this.logger.log(
        `[membership-confirm] Skipped for ${membership.id}: missing AISENSY config`,
      );
      return;
    }

    const claim = await this.invoices.update(
      { id: invoice.id, membershipWhatsAppSentAt: IsNull() },
      { membershipWhatsAppSentAt: new Date() },
    );
    if (!claim.affected) return;

    const firstName =
      user.fullName?.trim().split(/\s+/)[0] || 'Member';
    const amountPaid = formatInrAmountForTemplate(membership.amountPaidPaise);
    const invoiceNo = invoice.invoiceNumber;
    const membershipLabel = formatMembershipLabel(
      membership.planName,
      membership.planMonths,
    );
    const validity = formatMembershipValidity(membership.planMonths);
    const publicPdfUrl = this.buildPublicInvoiceUrl(invoice.id);
    const filename = `${invoice.invoiceNumber}.pdf`;

    try {
      await sendAiSensyCampaign({
        apiKey,
        campaignName,
        mobile,
        userName: firstName,
        source:
          this.config.get<string>('AISENSY_SOURCE')?.trim() ||
          'The Healing Mat',
        templateParams: [
          firstName,
          amountPaid,
          invoiceNo,
          membershipLabel,
          validity,
        ],
        media: {
          url: publicPdfUrl,
          filename,
        },
      });
      this.logger.log(
        `[membership-confirm] Sent to ${mobile} for membership ${membership.id} (pdf=${publicPdfUrl})`,
      );
    } catch (err) {
      await this.invoices.update(
        { id: invoice.id },
        { membershipWhatsAppSentAt: null },
      );
      throw err;
    }
  }

  private signInvoiceDownloadToken(invoiceId: string): string {
    const ttlRaw = Number(
      this.config.get<string>('INVOICE_PUBLIC_URL_TTL_SECONDS')?.trim() ||
        String(7 * 24 * 60 * 60),
    );
    const ttlSec = Number.isFinite(ttlRaw)
      ? Math.max(3600, Math.min(30 * 24 * 3600, ttlRaw))
      : 7 * 24 * 60 * 60;
    const exp = Math.floor(Date.now() / 1000) + ttlSec;
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    const sig = createHmac('sha256', secret)
      .update(`${invoiceId}.${exp}`)
      .digest('base64url');
    return `${exp}.${sig}`;
  }
}

function formatInrAmountForTemplate(paise: number): string {
  const rupees = Math.max(0, paise) / 100;
  return rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  });
}

function formatMembershipValidity(planMonths: number): string {
  const months = Math.max(1, Math.floor(planMonths));
  return months === 1 ? '1 Month' : `${months} Months`;
}

function formatMembershipLabel(planName: string, planMonths: number): string {
  const name = planName?.trim();
  if (name) return name;
  const months = Math.max(1, Math.floor(planMonths));
  return months === 1 ? 'Monthly' : `${months}-Month Membership`;
}
