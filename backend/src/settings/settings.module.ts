import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesAdminController } from './classes-admin.controller';
import { ScheduledClass } from './scheduled-class.entity';
import { ScheduledClassesService } from './scheduled-classes.service';
import { ScheduledTopic } from './scheduled-topic.entity';
import { ScheduledTopicsService } from './scheduled-topics.service';
import { SessionTiming } from './session-timing.entity';
import { SessionTimingsAdminController } from './session-timings-admin.controller';
import { SessionTimingsPublicController } from './session-timings-public.controller';
import { SessionTimingsService } from './session-timings.service';
import { SessionTopicsAdminController } from './session-topics-admin.controller';
import { SettingsAdminController } from './settings-admin.controller';
import { SettingsService } from './settings.service';
import { SessionsController } from './sessions.controller';
import { SiteSettings } from './site-settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SiteSettings,
      SessionTiming,
      ScheduledClass,
      ScheduledTopic,
    ]),
  ],
  controllers: [
    SettingsAdminController,
    SessionTimingsAdminController,
    SessionTimingsPublicController,
    ClassesAdminController,
    SessionTopicsAdminController,
    SessionsController,
  ],
  providers: [
    SettingsService,
    SessionTimingsService,
    ScheduledClassesService,
    ScheduledTopicsService,
  ],
  exports: [
    SettingsService,
    SessionTimingsService,
    ScheduledClassesService,
    ScheduledTopicsService,
  ],
})
export class SettingsModule {}
