import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_SEED_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_SEED_PASSWORD');

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set — skipping admin seed.',
      );
      return;
    }

    const existing = await this.admins.findOne({ where: { email } });
    if (existing) {
      return;
    }

    const admin = this.admins.create({
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
    });
    await this.admins.save(admin);
    this.logger.log(`Seeded admin account for ${email}`);
  }
}
