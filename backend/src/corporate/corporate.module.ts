import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsModule } from '../coupons/coupons.module';
import { Coupon } from '../coupons/coupon.entity';
import { PaymentsModule } from '../payments/payments.module';
import { Membership } from '../payments/membership.entity';
import { OtpChallenge } from '../users/otp-challenge.entity';
import { User } from '../users/user.entity';
import { Company } from './company.entity';
import { CorporateAdminController } from './corporate.admin.controller';
import { CorporateDomainVerification } from './corporate-domain-verification.entity';
import { CorporateMemberController } from './corporate.member.controller';
import { CorporatePlan } from './corporate-plan.entity';
import { CorporateService } from './corporate.service';

@Module({
  imports: [
    CouponsModule,
    PaymentsModule,
    TypeOrmModule.forFeature([
      Company,
      CorporatePlan,
      CorporateDomainVerification,
      Coupon,
      OtpChallenge,
      User,
      Membership,
    ]),
  ],
  controllers: [CorporateAdminController, CorporateMemberController],
  providers: [CorporateService],
  exports: [CorporateService],
})
export class CorporateModule {}
