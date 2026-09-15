import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { OrientationSlot } from './orientation-slot.entity';
import { TrialCohort } from './trial-cohort.entity';
import { TrialMessagingService } from './trial-messaging.service';
import { TrialRegistration } from './trial-registration.entity';
import { TrialSeedService } from './trial-seed.service';
import { TrialsController } from './trials.controller';
import { TrialsService } from './trials.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrialCohort,
      OrientationSlot,
      TrialRegistration,
      User,
    ]),
  ],
  controllers: [TrialsController],
  providers: [TrialsService, TrialSeedService, TrialMessagingService],
  exports: [TypeOrmModule, TrialsService, TrialMessagingService],
})
export class TrialsModule {}
