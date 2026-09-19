import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '../payments/membership.entity';
import { SettingsModule } from '../settings/settings.module';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { User } from '../users/user.entity';
import { MilestonesAdminController } from './milestones.admin.controller';
import { MilestonesService } from './milestones.service';
import { ReferralMilestone } from './referral-milestone.entity';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { RewardRedemptionRequest } from './reward-redemption-request.entity';

@Module({
  imports: [
    SettingsModule,
    TypeOrmModule.forFeature([
      User,
      Membership,
      TrialRegistration,
      ReferralMilestone,
      RewardRedemptionRequest,
    ]),
  ],
  controllers: [ReferralsController, MilestonesAdminController],
  providers: [ReferralsService, MilestonesService],
})
export class ReferralsModule {}
