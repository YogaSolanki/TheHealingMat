import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  indianFinancialYear,
  isValidFinancialYearLabel,
} from '../payments/invoice-category';
import { DEFAULT_REFERRAL_DISCOUNT_PERCENT } from '../payments/membership-plans';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import {
  DEFAULT_REFERRAL_MESSAGE_TEMPLATE,
  normalizeReferralMessageTemplate,
} from './referral-message';
import { SiteSettings } from './site-settings.entity';

/** Default Drive fallback when env / DB have no e-book URL yet. */
export const DEFAULT_MEMBERSHIP_EBOOK_URL =
  'https://drive.google.com/file/d/1h3OEN5SKhRU4JYk5YtRCWTonaWyfhp9R/view?usp=sharing';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly settings: Repository<SiteSettings>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureReferralDiscountColumn();
    await this.ensureReferralMessageTemplateColumn();
    await this.ensurePrivateSpacePasswordColumn();
    await this.ensureInvoiceFinancialYearOverrideColumn();
    await this.ensureMembershipEbookUrlColumn();
    await this.ensureRow();
    await this.ensureMembershipEbookUrlSeeded();
  }

  async getAdminSettings() {
    const row = await this.ensureRow();
    return this.toAdminResponse(row);
  }

  async getLiveSessionUrl(): Promise<string | null> {
    const row = await this.ensureRow();
    const url = row.liveSessionUrl?.trim();
    return url || null;
  }

  /** External e-book PDF URL for entitled 12-month members (fallback / alternate). */
  async getMembershipEbookUrl(): Promise<string | null> {
    const row = await this.ensureRow();
    const url = row.membershipEbookUrl?.trim();
    return url || null;
  }

  async getReferralDiscountPercent(): Promise<number> {
    const row = await this.ensureRow();
    return this.normalizePercent(row.referralDiscountPercent);
  }

  /** Resolved template (never empty) for member share / WhatsApp messages. */
  async getReferralMessageTemplate(): Promise<string> {
    const row = await this.ensureRow();
    return normalizeReferralMessageTemplate(row.referralMessageTemplate);
  }

  /** Stored private-space password hash, or null when using env fallback only. */
  async getPrivateSpacePasswordHash(): Promise<string | null> {
    const row = await this.ensureRow();
    const hash = row.privateSpacePasswordHash?.trim();
    return hash || null;
  }

  async setPrivateSpacePasswordHash(password: string) {
    const row = await this.ensureRow();
    row.privateSpacePasswordHash = await bcrypt.hash(password, 10);
    await this.settings.save(row);
  }

  /**
   * FY label used when issuing invoices. Override wins; otherwise Asia/Kolkata
   * Indian FY (Apr–Mar), which advances automatically on 1 April.
   */
  async getActiveInvoiceFinancialYear(issuedAt: Date = new Date()): Promise<{
    financialYear: string;
    computedFinancialYear: string;
    override: string | null;
  }> {
    const row = await this.ensureRow();
    const computedFinancialYear = indianFinancialYear(issuedAt);
    const override = row.invoiceFinancialYearOverride?.trim() || null;
    return {
      financialYear: override || computedFinancialYear,
      computedFinancialYear,
      override,
    };
  }

  async setInvoiceFinancialYearOverride(override: string | null) {
    const row = await this.ensureRow();
    if (override == null || override.trim() === '') {
      row.invoiceFinancialYearOverride = null;
    } else {
      const next = override.trim();
      if (!isValidFinancialYearLabel(next)) {
        throw new BadRequestException(
          'Financial year must look like 26-27 (two-digit Apr–Mar label).',
        );
      }
      row.invoiceFinancialYearOverride = next;
    }
    await this.settings.save(row);
    return this.getActiveInvoiceFinancialYear();
  }

  async updateSettings(dto: UpdateSiteSettingsDto) {
    const row = await this.ensureRow();
    if (dto.liveSessionUrl !== undefined) {
      const next = dto.liveSessionUrl?.trim() || null;
      row.liveSessionUrl = next;
    }
    if (dto.membershipEbookUrl !== undefined) {
      row.membershipEbookUrl = dto.membershipEbookUrl?.trim() || null;
    }
    if (dto.referralDiscountPercent !== undefined) {
      row.referralDiscountPercent = this.normalizePercent(
        dto.referralDiscountPercent,
      );
    }
    if (dto.referralMessageTemplate !== undefined) {
      const next = dto.referralMessageTemplate?.trim() || null;
      row.referralMessageTemplate = next;
    }
    const saved = await this.settings.save(row);
    return this.toAdminResponse(saved);
  }

  private toAdminResponse(row: SiteSettings) {
    return {
      liveSessionUrl: row.liveSessionUrl,
      membershipEbookUrl: row.membershipEbookUrl,
      referralDiscountPercent: this.normalizePercent(
        row.referralDiscountPercent,
      ),
      referralMessageTemplate: normalizeReferralMessageTemplate(
        row.referralMessageTemplate,
      ),
      defaultReferralMessageTemplate: DEFAULT_REFERRAL_MESSAGE_TEMPLATE,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private resolveMembershipEbookUrlSeed() {
    return (
      this.config.get<string>('MEMBERSHIP_EBOOK_URL')?.trim() ||
      DEFAULT_MEMBERSHIP_EBOOK_URL
    );
  }

  private normalizePercent(value: number | null | undefined) {
    const n = Number(value);
    if (!Number.isFinite(n)) return DEFAULT_REFERRAL_DISCOUNT_PERCENT;
    return Math.min(100, Math.max(0, Math.round(n)));
  }

  /** Production DBs may lack this column until synchronize/migration runs. */
  private async ensureReferralDiscountColumn() {
    await this.settings.query(`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "referralDiscountPercent" integer NOT NULL DEFAULT ${DEFAULT_REFERRAL_DISCOUNT_PERCENT}
    `);
  }

  private async ensureReferralMessageTemplateColumn() {
    await this.settings.query(`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "referralMessageTemplate" text NULL
    `);
  }

  private async ensurePrivateSpacePasswordColumn() {
    await this.settings.query(`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "privateSpacePasswordHash" varchar NULL
    `);
  }

  private async ensureInvoiceFinancialYearOverrideColumn() {
    await this.settings.query(`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "invoiceFinancialYearOverride" varchar(8) NULL
    `);
  }

  private async ensureMembershipEbookUrlColumn() {
    await this.settings.query(`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "membershipEbookUrl" text NULL
    `);
  }

  /** Backfill Drive / env URL once if the column is still empty. */
  private async ensureMembershipEbookUrlSeeded() {
    const row = await this.ensureRow();
    if (row.membershipEbookUrl?.trim()) return;
    row.membershipEbookUrl = this.resolveMembershipEbookUrlSeed();
    await this.settings.save(row);
  }

  private async ensureRow(): Promise<SiteSettings> {
    const existing = await this.settings.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (existing[0]) return existing[0];

    const fromEnv =
      this.config.get<string>('LIVE_SESSION_URL')?.trim() ||
      this.config.get<string>('NEXT_PUBLIC_LIVE_SESSION_URL')?.trim() ||
      null;

    return this.settings.save(
      this.settings.create({
        liveSessionUrl: fromEnv,
        membershipEbookUrl: this.resolveMembershipEbookUrlSeed(),
        referralDiscountPercent: DEFAULT_REFERRAL_DISCOUNT_PERCENT,
        referralMessageTemplate: null,
        privateSpacePasswordHash: null,
        invoiceFinancialYearOverride: null,
      }),
    );
  }
}
