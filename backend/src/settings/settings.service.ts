import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    await this.ensureRow();
  }

  async getAdminSettings() {
    const row = await this.ensureRow();
    return {
      liveSessionUrl: row.liveSessionUrl,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getLiveSessionUrl(): Promise<string | null> {
    const row = await this.ensureRow();
    const url = row.liveSessionUrl?.trim();
    return url || null;
  }

  async updateSettings(dto: UpdateSiteSettingsDto) {
    const row = await this.ensureRow();
    if (dto.liveSessionUrl !== undefined) {
      const next = dto.liveSessionUrl?.trim() || null;
      row.liveSessionUrl = next;
    }
    const saved = await this.settings.save(row);
    return {
      liveSessionUrl: saved.liveSessionUrl,
      updatedAt: saved.updatedAt.toISOString(),
    };
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
      }),
    );
  }
}
