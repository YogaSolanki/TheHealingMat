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
        'ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set - skipping admin seed.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await this.admins.findOne({ where: { email } });

    if (existing) {
      existing.passwordHash = passwordHash;
      existing.role = 'admin';
      await this.admins.save(existing);
      this.logger.log(`Updated seeded admin account for ${email}`);
      return;
    }

    await this.admins.save(
      this.admins.create({
        email,
        passwordHash,
        role: 'admin',
      }),
    );
    this.logger.log(`Seeded admin account for ${email}`);
  }
}
