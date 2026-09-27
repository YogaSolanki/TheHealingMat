import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, IsNull, Repository } from 'typeorm';
import { sendResendEmail } from '../mail/resend';
import { sendMsg91WhatsAppTemplate } from '../sms/msg91-whatsapp';
import { resolveFrontendBaseUrl } from '../common/frontend-url';
import { SessionTimingsService } from '../settings/session-timings.service';
import { User } from '../users/user.entity';
import { TrialStatus } from '../users/enums/trial-status.enum';
import {
  formatTrialDateForMessage,
} from './cohort-schedule';
import { TrialRegistration } from './trial-registration.entity';

const REMINDER_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 10 * 60 * 1000;

@Injectable()
export class TrialMessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrialMessagingService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(TrialRegistration)
    private readonly registrations: Repository<TrialRegistration>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly sessionTimings: SessionTimingsService,
  ) {}

  onModuleInit() {
    // Fire once shortly after boot, then on an interval.
    void this.processDueReminders();
    this.timer = setInterval(() => {
      void this.processDueReminders();
    }, POLL_INTERVAL_MS);
    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async sendWelcome(user: User, registration: TrialRegistration): Promise<void> {
    if (registration.welcomeMessageSentAt) return;

    const startLabel = formatTrialDateForMessage(registration.trialStartsAt);
    const endLabel = formatTrialDateForMessage(registration.trialEndsAt);
    const name = user.fullName?.trim().split(/\s+/)[0] || 'there';
    const memberArea = this.memberAreaUrl();
    const sessionTimes = await this.formatSessionTimes();

    const text =
      `Welcome to The Healing Mat, ${name}!\n\n` +
      `Your 14-Day Free Trial starts on ${startLabel}.\n` +
      `Your trial runs until ${endLabel}.\n\n` +
      `You can join your sessions from the Member Area:\n${memberArea}\n\n` +
      `Session times once your trial starts: ${sessionTimes.labelList}.`;

    await this.deliver(user, {
      kind: 'welcome',
      text,
      bodyValues: [name, startLabel, endLabel, memberArea],
      templateEnv: 'MSG91_WHATSAPP_TEMPLATE_WELCOME',
      emailSubject: 'Welcome to The Healing Mat — your free trial dates',
    });

    registration.welcomeMessageSentAt = new Date();
    await this.registrations.save(registration);
  }

  async sendTrialStartingReminder(
    user: User,
    registration: TrialRegistration,
  ): Promise<void> {
    if (registration.reminderSentAt) return;

    const startLabel = formatTrialDateForMessage(registration.trialStartsAt);
    const endLabel = formatTrialDateForMessage(registration.trialEndsAt);
    const name = user.fullName?.trim().split(/\s+/)[0] || 'there';
    const memberArea = this.memberAreaUrl();
    const sessionTimes = await this.formatSessionTimes();

    const text =
      `Hi ${name}, your The Healing Mat free trial starts on ${startLabel}.\n\n` +
      `Join your sessions from the Member Area:\n${memberArea}\n\n` +
      `Session times: ${sessionTimes.labelList}.\n` +
      `Your trial runs until ${endLabel}.`;

    await this.deliver(user, {
      kind: 'reminder',
      text,
      bodyValues: [
        name,
        startLabel,
        sessionTimes.primary,
        sessionTimes.secondary,
        memberArea,
      ],
      templateEnv: 'MSG91_WHATSAPP_TEMPLATE_REMINDER',
      emailSubject: 'Your free trial starts soon — The Healing Mat',
    });

    registration.reminderSentAt = new Date();
    await this.registrations.save(registration);
  }

  async processDueReminders(): Promise<void> {
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + REMINDER_LOOKAHEAD_MS);
      const due = await this.registrations.find({
        where: {
          status: TrialStatus.Scheduled,
          reminderSentAt: IsNull(),
          trialStartsAt: LessThanOrEqual(windowEnd),
          // Still upcoming or just starting
        },
        take: 50,
      });

      for (const registration of due) {
        if (registration.trialStartsAt.getTime() < now.getTime() - 60 * 60 * 1000) {
          // Started more than an hour ago — skip reminder, mark to avoid retries.
          registration.reminderSentAt = now;
          await this.registrations.save(registration);
          continue;
        }
        const user = await this.users.findOne({
          where: { id: registration.userId },
        });
        if (!user) continue;
        try {
          await this.sendTrialStartingReminder(user, registration);
        } catch (err) {
          this.logger.warn(
            `Trial reminder failed for ${registration.userId}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        `Reminder poll failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private memberAreaUrl(): string {
    const base = resolveFrontendBaseUrl(
      this.config.get<string>('FRONTEND_URL'),
    );
    return `${base}/dashboard`;
  }

  private async deliver(
    user: User,
    input: {
      kind: 'welcome' | 'reminder';
      text: string;
      bodyValues: string[];
      templateEnv: string;
      emailSubject: string;
    },
  ): Promise<void> {
    const mobile = user.mobile?.trim();
    if (mobile) {
      const sent = await this.tryWhatsApp(mobile, input);
      if (sent) return;
    }

    if (user.email?.trim()) {
      await this.tryEmail(user.email.trim(), input.emailSubject, input.text);
      return;
    }

    this.logger.log(
      `[trial-${input.kind}] No mobile/email for user ${user.id}. Message:\n${input.text}`,
    );
  }

  private async tryWhatsApp(
    mobile: string,
    input: {
      kind: string;
      text: string;
      bodyValues: string[];
      templateEnv: string;
    },
  ): Promise<boolean> {
    const authKey = this.config.get<string>('MSG91_AUTH_KEY')?.trim();
    const integratedNumber = this.config
      .get<string>('MSG91_WHATSAPP_NUMBER')
      ?.trim();
    const templateName = this.config.get<string>(input.templateEnv)?.trim();
    const namespace = this.config
      .get<string>('MSG91_WHATSAPP_NAMESPACE')
      ?.trim();
    const languageCode = this.config
      .get<string>('MSG91_WHATSAPP_LANGUAGE')
      ?.trim();

    if (!authKey || !integratedNumber || !templateName) {
      this.logger.log(
        `[trial-${input.kind}] WhatsApp not fully configured — logging message for ${mobile}:\n${input.text}`,
      );
      return true; // treat as delivered in dev so we don't re-send forever
    }

    try {
      await sendMsg91WhatsAppTemplate({
        authKey,
        integratedNumber,
        templateName,
        namespace,
        languageCode,
        mobile,
        bodyValues: input.bodyValues,
      });
      return true;
    } catch (err) {
      this.logger.warn(
        `WhatsApp ${input.kind} failed for ${mobile}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return false;
    }
  }

  private async tryEmail(
    email: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('RESEND_FROM_EMAIL')?.trim();
    if (!apiKey || !from) {
      this.logger.log(
        `[trial-email] Resend not configured — logging message for ${email}:\n${text}`,
      );
      return;
    }
    await sendResendEmail({
      apiKey,
      from,
      to: email,
      subject,
      text,
    });
  }

  private async formatSessionTimes() {
    try {
      const rows = await this.sessionTimings.list(false);
      const labels = rows.map((row) => row.label).filter(Boolean);
      if (labels.length > 0) {
        const morning = labels.find((label) => /AM$/i.test(label));
        const evening = [...labels].reverse().find((label) => /PM$/i.test(label));
        return {
          labelList: this.joinLabels(labels),
          primary: morning ?? labels[0],
          secondary: evening ?? labels[labels.length - 1] ?? labels[0],
        };
      }
    } catch (err) {
      this.logger.warn(
        `Unable to load session timings for trial message: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    return {
      labelList: 'see Member Area for current times',
      primary: 'Member Area',
      secondary: 'schedule',
    };
  }

  private joinLabels(labels: string[]) {
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
  }
}
