import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, IsNull, Repository } from 'typeorm';
import { sendResendEmail } from '../mail/resend';
import { sendAiSensyCampaign } from '../sms/aisensy-whatsapp';
import { sendMsg91WhatsAppTemplate } from '../sms/msg91-whatsapp';
import {
  buildMemberAccessLink,
  resolveFrontendBaseUrl,
} from '../common/frontend-url';
import { Region } from '../users/enums/region.enum';
import { SessionTimingsService } from '../settings/session-timings.service';
import { User } from '../users/user.entity';
import { TrialStatus } from '../users/enums/trial-status.enum';
import {
  formatTrialDateForMessage,
  formatTrialEndDateForMessage,
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

  /**
   * AiSensy app_welcome — sent once after any new India signup (trial or membership).
   * Does not block signup; failures are logged only.
   */
  async sendAppWelcomeOnSignup(user: User): Promise<void> {
    if (user.region !== Region.India) return;
    const mobile = user.mobile?.trim();
    if (!mobile) return;

    const apiKey = this.config.get<string>('AISENSY_API_KEY')?.trim();
    const campaignName =
      this.config.get<string>('AISENSY_WELCOME_CAMPAIGN_NAME')?.trim() ||
      'app_welcome';

    if (!apiKey || !campaignName) {
      this.logger.log(
        `[app-welcome] Skipped for ${user.id}: missing AISENSY_API_KEY or AISENSY_WELCOME_CAMPAIGN_NAME`,
      );
      return;
    }

    const firstName =
      user.fullName?.trim().split(/\s+/)[0] || 'Member';
    const paramCountRaw = Number(
      this.config.get<string>('AISENSY_WELCOME_PARAM_COUNT')?.trim() || '0',
    );
    // Welcome Live API campaign may have 0 body vars even if the template name suggests otherwise.
    const paramCount = Number.isFinite(paramCountRaw)
      ? Math.max(0, Math.min(4, paramCountRaw))
      : 0;
    const templateParams = Array.from({ length: paramCount }, () => firstName);

    try {
      await sendAiSensyCampaign({
        apiKey,
        campaignName,
        mobile,
        userName: firstName,
        source:
          this.config.get<string>('AISENSY_SOURCE')?.trim() ||
          'The Healing Mat',
        templateParams,
      });
      this.logger.log(`[app-welcome] Sent to ${mobile} for user ${user.id}`);
    } catch (err) {
      this.logger.warn(
        `[app-welcome] Failed for ${mobile}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Sent once when the member starts / registers for the free trial.
   * India WhatsApp: AiSensy campaign Trial_Start ({{1}} name, {{2}} begin date,
   * {{3}}–{{4}} trial period, {{5}} permanent session link).
   * Falls back to MSG91 / email when AiSensy is unavailable.
   */
  async sendWelcome(user: User, registration: TrialRegistration): Promise<void> {
    if (registration.welcomeMessageSentAt) return;

    const startLabel = formatTrialDateForMessage(registration.trialStartsAt);
    const endLabel = formatTrialEndDateForMessage(registration.trialEndsAt);
    const name = user.fullName?.trim().split(/\s+/)[0] || 'there';
    const permanentLink = this.permanentSessionLink(user);
    const sessionTimes = await this.formatSessionTimes();

    if (user.region === Region.India && user.mobile?.trim()) {
      const sent = await this.tryAiSensyTrialStart({
        mobile: user.mobile.trim(),
        name,
        startLabel,
        endLabel,
        permanentLink,
      });
      if (sent) {
        registration.welcomeMessageSentAt = new Date();
        await this.registrations.save(registration);
        return;
      }
    }

    const text =
      `Hi ${name},\n\n` +
      `Your 14-day free yoga trial is scheduled to begin on ${startLabel}.\n\n` +
      `Your Trial Details\n\n` +
      `- Trial Period: ${startLabel} – ${endLabel}\n` +
      `- Available Session Timings: ${sessionTimes.labelList}\n` +
      `- Permanent Session Access Link: ${permanentLink}\n\n` +
      `Please bookmark your permanent session access link for easy access to your classes throughout the trial period.\n` +
      `—Team The Healing Mat`;

    await this.deliver(user, {
      kind: 'welcome',
      text,
      bodyValues: [name, startLabel, endLabel, permanentLink],
      templateEnv: 'MSG91_WHATSAPP_TEMPLATE_WELCOME',
      emailSubject: 'Your free trial is scheduled — The Healing Mat',
    });

    registration.welcomeMessageSentAt = new Date();
    await this.registrations.save(registration);
  }

  /**
   * AiSensy Trial_Start — after free trial registration (India mobile).
   * Template vars: {{1}} name, {{2}} begin date, {{3}} period start,
   * {{4}} period end, {{5}} permanent session link.
   */
  private async tryAiSensyTrialStart(input: {
    mobile: string;
    name: string;
    startLabel: string;
    endLabel: string;
    permanentLink: string;
  }): Promise<boolean> {
    const apiKey = this.config.get<string>('AISENSY_API_KEY')?.trim();
    const campaignName =
      this.config.get<string>('AISENSY_TRIAL_START_CAMPAIGN_NAME')?.trim() ||
      'Trial_Start';

    if (!apiKey || !campaignName) {
      this.logger.log(
        `[trial-start] Skipped for ${input.mobile}: missing AISENSY_API_KEY or AISENSY_TRIAL_START_CAMPAIGN_NAME`,
      );
      return false;
    }

    try {
      await sendAiSensyCampaign({
        apiKey,
        campaignName,
        mobile: input.mobile,
        userName: input.name,
        source:
          this.config.get<string>('AISENSY_SOURCE')?.trim() ||
          'The Healing Mat',
        templateParams: [
          input.name,
          input.startLabel,
          input.startLabel,
          input.endLabel,
          input.permanentLink,
        ],
      });
      this.logger.log(
        `[trial-start] Sent AiSensy ${campaignName} to ${input.mobile}`,
      );
      return true;
    } catch (err) {
      this.logger.warn(
        `[trial-start] AiSensy failed for ${input.mobile}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return false;
    }
  }

  async sendTrialStartingReminder(
    user: User,
    registration: TrialRegistration,
  ): Promise<void> {
    if (registration.reminderSentAt) return;

    const startLabel = formatTrialDateForMessage(registration.trialStartsAt);
    const endLabel = formatTrialEndDateForMessage(registration.trialEndsAt);
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

  private permanentSessionLink(user: User): string {
    if (user.accessLinkToken?.trim()) {
      return buildMemberAccessLink(
        this.config.get<string>('FRONTEND_URL'),
        user.accessLinkToken.trim(),
      );
    }
    return this.memberAreaUrl();
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
      // Trial emails list trial-only Mon–Sat class times (not membership slots).
      const labels = rows
        .filter((row) => Boolean(row.isTrial))
        .map((row) => row.label)
        .filter(Boolean);
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
