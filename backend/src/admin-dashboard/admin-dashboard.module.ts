import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '../payments/membership.entity';
import { PaymentOrder } from '../payments/payment-order.entity';
import { OrientationSlot } from '../trials/orientation-slot.entity';
import { TrialCohort } from '../trials/trial-cohort.entity';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { OtpChallenge } from '../users/otp-challenge.entity';
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
      Membership,
      PaymentOrder,
      OtpChallenge,
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
