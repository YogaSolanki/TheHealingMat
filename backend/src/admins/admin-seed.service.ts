import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';

const ADMIN_EMAIL = 'shagun.thakur0107@gmail.com';
const ADMIN_PASSWORD = 'Shagun@65000';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
  ) {}

  async onModuleInit() {
    const email = ADMIN_EMAIL.toLowerCase();
    const existing = await this.admins.findOne({ where: { email } });

    if (existing) {
      return;
    }

    const admin = this.admins.create({
      email,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: 'admin',
    });
    await this.admins.save(admin);
    this.logger.log(`Seeded admin account for ${email}`);
  }
}
