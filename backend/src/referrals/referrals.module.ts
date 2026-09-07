import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '../payments/membership.entity';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { User } from '../users/user.entity';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Membership, TrialRegistration]),
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
})
export class ReferralsModule {}
