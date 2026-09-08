import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsModule } from '../coupons/coupons.module';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { Membership } from './membership.entity';
import { MembershipOfferPrice } from './membership-offer-price.entity';
import { MembershipOffer } from './membership-offer.entity';
import { MembershipOffersAdminController } from './membership-offers.admin.controller';
import { MembershipOffersService } from './membership-offers.service';
import { MembershipPlan } from './membership-plan.entity';
import { MembershipPlansService } from './membership-plans.service';
import { PaymentOrder } from './payment-order.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    CouponsModule,
    TypeOrmModule.forFeature([
      PaymentOrder,
      Membership,
      MembershipPlan,
      MembershipOffer,
      MembershipOfferPrice,
      TrialRegistration,
    ]),
  ],
  controllers: [PaymentsController, MembershipOffersAdminController],
  providers: [
    PaymentsService,
    MembershipPlansService,
    MembershipOffersService,
  ],
  exports: [MembershipPlansService, MembershipOffersService],
})
export class PaymentsModule {}
