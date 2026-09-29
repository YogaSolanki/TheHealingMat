import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersSchemaService implements OnModuleInit {
  private readonly logger = new Logger(UsersSchemaService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "accountStatus" varchar NOT NULL DEFAULT 'active'
      `);
    } catch (err) {
      this.logger.warn(
        `Could not ensure users.accountStatus: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
