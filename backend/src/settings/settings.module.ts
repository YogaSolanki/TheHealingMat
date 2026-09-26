import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesAdminController } from './classes-admin.controller';
import { ScheduledClass } from './scheduled-class.entity';
import { ScheduledClassesService } from './scheduled-classes.service';
import { SessionTiming } from './session-timing.entity';
import { SessionTimingsAdminController } from './session-timings-admin.controller';
import { SessionTimingsService } from './session-timings.service';
import { SettingsAdminController } from './settings-admin.controller';
import { SettingsService } from './settings.service';
import { SessionsController } from './sessions.controller';
import { SiteSettings } from './site-settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteSettings, SessionTiming, ScheduledClass]),
  ],
  controllers: [
    SettingsAdminController,
    SessionTimingsAdminController,
    ClassesAdminController,
    SessionsController,
  ],
  providers: [SettingsService, SessionTimingsService, ScheduledClassesService],
  exports: [SettingsService, SessionTimingsService, ScheduledClassesService],
})
export class SettingsModule {}
