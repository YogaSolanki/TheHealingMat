import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { TrialsModule } from './trials/trials.module';
import { UsersModule } from './users/users.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    HealthModule,
    AdminsModule,
    UsersModule,
    AuthModule,
    TrialsModule,
    AdminDashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
