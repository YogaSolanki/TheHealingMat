import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrientationSlot } from '../trials/orientation-slot.entity';
import { TrialCohort } from '../trials/trial-cohort.entity';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { User } from '../users/user.entity';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      TrialRegistration,
      TrialCohort,
      OrientationSlot,
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
