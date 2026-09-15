import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsAdminController } from './settings-admin.controller';
import { SettingsService } from './settings.service';
import { SessionsController } from './sessions.controller';
import { SiteSettings } from './site-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteSettings])],
  controllers: [SettingsAdminController, SessionsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
