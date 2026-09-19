import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_REFERRAL_DISCOUNT_PERCENT } from '../payments/membership-plans';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SiteSettings } from './site-settings.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly settings: Repository<SiteSettings>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureReferralDiscountColumn();
    await this.ensureRow();
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

  async getReferralDiscountPercent(): Promise<number> {
    const row = await this.ensureRow();
    return this.normalizePercent(row.referralDiscountPercent);
  }

  async updateSettings(dto: UpdateSiteSettingsDto) {
    const row = await this.ensureRow();
    if (dto.liveSessionUrl !== undefined) {
      const next = dto.liveSessionUrl?.trim() || null;
      row.liveSessionUrl = next;
    }
    if (dto.referralDiscountPercent !== undefined) {
      row.referralDiscountPercent = this.normalizePercent(
        dto.referralDiscountPercent,
      );
    }
    const saved = await this.settings.save(row);
    return this.toAdminResponse(saved);
  }

  private toAdminResponse(row: SiteSettings) {
    return {
      liveSessionUrl: row.liveSessionUrl,
      referralDiscountPercent: this.normalizePercent(
        row.referralDiscountPercent,
      ),
      updatedAt: row.updatedAt.toISOString(),
    };
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
        referralDiscountPercent: DEFAULT_REFERRAL_DISCOUNT_PERCENT,
      }),
    );
  }
}
