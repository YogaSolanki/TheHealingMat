import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { sendResendEmail } from '../mail/resend';
import {
  checkFormTiming,
  honeypotFilled,
  isFreeEmailDomain,
  isLowQualityEnquiryMessage,
} from './corporate-enquiry-spam';
import { ContactMessage } from './contact-message.entity';
import { CorporateEnquiry } from './corporate-enquiry.entity';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { SubmitCorporateEnquiryDto } from './dto/submit-corporate-enquiry.dto';

const CONTACT_RATE_LIMIT = 3;
const CONTACT_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ContactMessage)
    private readonly messages: Repository<ContactMessage>,
    @InjectRepository(CorporateEnquiry)
    private readonly corporateEnquiries: Repository<CorporateEnquiry>,
  ) {}

  async submit(dto: SubmitContactDto) {
    if (honeypotFilled(dto.website)) {
      this.logger.warn('Contact message dropped (honeypot).');
      return {
        success: true,
        message: 'Thanks — your message has been sent.',
        id: 'ok',
      };
    }

    const timing = checkFormTiming(dto.formOpenedAt);
    if (!timing.ok) {
      throw new BadRequestException(
        timing.reason === 'too_fast'
          ? 'Please take a moment to complete the form, then try again.'
          : 'Please reload the page and submit the form again.',
      );
    }

    const name = dto.name.trim();
    const phone = dto.phone.trim();
    const email = dto.email?.trim().toLowerCase() || null;
    const message = dto.message.trim();

    if (isLowQualityEnquiryMessage(message)) {
      throw new BadRequestException(
        'Please describe how we can help in a short message.',
      );
    }

    const since = new Date(Date.now() - CONTACT_RATE_WINDOW_MS);
    const recentByPhone = await this.messages.count({
      where: { phone, createdAt: MoreThanOrEqual(since) },
    });
    if (recentByPhone >= CONTACT_RATE_LIMIT) {
      throw new BadRequestException(
        'Too many messages from this phone today. Please try again tomorrow.',
      );
    }
    if (email) {
      const recentByEmail = await this.messages.count({
        where: { email, createdAt: MoreThanOrEqual(since) },
      });
      if (recentByEmail >= CONTACT_RATE_LIMIT) {
        throw new BadRequestException(
          'Too many messages from this email today. Please try again tomorrow.',
        );
      }
    }

    const saved = await this.messages.save(
      this.messages.create({
        name,
        phone,
        email,
        message,
        emailed: false,
      }),
    );

    try {
      await this.sendContactEmail({ name, phone, email, message, id: saved.id });
      saved.emailed = true;
      await this.messages.save(saved);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(`Failed to email contact message ${saved.id}: ${detail}`);
      throw new ServiceUnavailableException(
        'We received your message but could not send the notification email. Please try again shortly, or email us directly.',
      );
    }

    return {
      success: true,
      message: 'Thanks — your message has been sent.',
      id: saved.id,
    };
  }

  async submitCorporate(dto: SubmitCorporateEnquiryDto) {
    // Silent drop for honeypot fills — looks successful to bots.
    if (honeypotFilled(dto.website)) {
      this.logger.warn('Corporate enquiry dropped (honeypot).');
      return {
        success: true,
        message: 'Thanks — your corporate enquiry has been sent.',
        id: 'ok',
      };
    }

    const timing = checkFormTiming(dto.formOpenedAt);
    if (!timing.ok) {
      throw new BadRequestException(
        timing.reason === 'too_fast'
          ? 'Please take a moment to complete the form, then try again.'
          : 'Please reload the page and submit the form again.',
      );
    }

    const name = dto.name.trim();
    const company = dto.company.trim();
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();
    const message = dto.message.trim();

    if (isFreeEmailDomain(email)) {
      throw new BadRequestException(
        'Please use your company work email (not Gmail, Yahoo, Outlook, etc.).',
      );
    }

    if (isLowQualityEnquiryMessage(message)) {
      throw new BadRequestException(
        'Please describe how we can help in a short message.',
      );
    }

    const recentCount = await this.corporateEnquiries.count({
      where: {
        email,
        createdAt: MoreThanOrEqual(
          new Date(Date.now() - CONTACT_RATE_WINDOW_MS),
        ),
      },
    });
    if (recentCount >= CONTACT_RATE_LIMIT) {
      throw new BadRequestException(
        'Too many enquiries from this email today. Please try again tomorrow.',
      );
    }

    const saved = await this.corporateEnquiries.save(
      this.corporateEnquiries.create({
        name,
        company,
        email,
        phone,
        employees: '',
        message,
        emailed: false,
      }),
    );

    try {
      await this.sendCorporateEmail({
        id: saved.id,
        name,
        company,
        email,
        phone,
        message,
      });
      saved.emailed = true;
      await this.corporateEnquiries.save(saved);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(
        `Failed to email corporate enquiry ${saved.id}: ${detail}`,
      );
      throw new ServiceUnavailableException(
        'We received your enquiry but could not send the notification email. Please try again shortly, or email us directly.',
      );
    }

    return {
      success: true,
      message: 'Thanks — your corporate enquiry has been sent.',
      id: saved.id,
    };
  }

  private resolveMailConfig() {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured.');
    }

    const to =
      this.config.get<string>('CONTACT_TO_EMAIL')?.trim() ||
      'solankipr@gmail.com';
    const from =
      this.config.get<string>('RESEND_FROM_EMAIL')?.trim() ||
      'The Healing Mat <onboarding@resend.dev>';

    return { apiKey, to, from };
  }

  private async sendContactEmail(input: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    message: string;
  }) {
    const { apiKey, to, from } = this.resolveMailConfig();
    const replyTo = input.email || undefined;
    const subject = `Contact form: ${input.name}`;
    const text = [
      'New contact form submission from The Healing Mat website.',
      '',
      `Name: ${input.name}`,
      `Phone: ${input.phone}`,
      `Email: ${input.email || '(not provided)'}`,
      '',
      'Message:',
      input.message,
      '',
      `Reference: ${input.id}`,
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #243028;">
        <h2 style="color: #1f6b3a; margin: 0 0 12px;">New contact form submission</h2>
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p style="margin: 0 0 8px;"><strong>Phone:</strong> ${escapeHtml(input.phone)}</p>
        <p style="margin: 0 0 16px;"><strong>Email:</strong> ${escapeHtml(input.email || '(not provided)')}</p>
        <p style="margin: 0 0 6px;"><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; margin: 0 0 16px;">${escapeHtml(input.message)}</p>
        <p style="font-size: 12px; color: #6b7c6e; margin: 0;">Reference: ${escapeHtml(input.id)}</p>
      </div>
    `;

    const payload = await sendResendEmail({
      apiKey,
      from,
      to,
      subject,
      text,
      html,
      replyTo,
    });

    this.logger.log(`Contact email sent via Resend (${payload.id ?? 'ok'}) to ${to}`);
  }

  private async sendCorporateEmail(input: {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    message: string;
  }) {
    const { apiKey, to, from } = this.resolveMailConfig();
    const subject = `Corporate enquiry: ${input.company}`;
    const text = [
      'New corporate enquiry from The Healing Mat website.',
      '',
      `Name: ${input.name}`,
      `Company / Organisation: ${input.company}`,
      `Work Email: ${input.email}`,
      `Phone: ${input.phone}`,
      '',
      'How can we help you?',
      input.message,
      '',
      `Reference: ${input.id}`,
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #243028;">
        <h2 style="color: #1f6b3a; margin: 0 0 12px;">New corporate enquiry</h2>
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p style="margin: 0 0 8px;"><strong>Company / Organisation:</strong> ${escapeHtml(input.company)}</p>
        <p style="margin: 0 0 8px;"><strong>Work Email:</strong> ${escapeHtml(input.email)}</p>
        <p style="margin: 0 0 16px;"><strong>Phone:</strong> ${escapeHtml(input.phone)}</p>
        <p style="margin: 0 0 6px;"><strong>How can we help you?</strong></p>
        <p style="white-space: pre-wrap; margin: 0 0 16px;">${escapeHtml(input.message)}</p>
        <p style="font-size: 12px; color: #6b7c6e; margin: 0;">Reference: ${escapeHtml(input.id)}</p>
      </div>
    `;

    const payload = await sendResendEmail({
      apiKey,
      from,
      to,
      subject,
      text,
      html,
      replyTo: input.email,
    });

    this.logger.log(
      `Corporate enquiry email sent via Resend (${payload.id ?? 'ok'}) to ${to}`,
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
