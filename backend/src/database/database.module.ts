import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = config.get<string>('DATABASE_URL')?.trim();
        const synchronize =
          config.get<string>('DB_SYNCHRONIZE') === 'true' ||
          config.get<string>('NODE_ENV') !== 'production';

        const base = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize,
          retryAttempts: 10,
          retryDelay: 3000,
        };

        if (databaseUrl) {
          return {
            ...base,
            url: databaseUrl,
            ssl:
              config.get<string>('DB_SSL') === 'false'
                ? false
                : { rejectUnauthorized: false },
          };
        }

        return {
          ...base,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get('DB_PORT', 5432)),
          username: config.get<string>('DB_USERNAME', 'healingmat'),
          password: config.get<string>('DB_PASSWORD', 'healingmat'),
          database: config.get<string>('DB_NAME', 'healingmat'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
