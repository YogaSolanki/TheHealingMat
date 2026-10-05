import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsModule } from '../coupons/coupons.module';
import { SettingsModule } from '../settings/settings.module';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { User } from '../users/user.entity';
import { Invoice } from './invoice.entity';
import { InvoiceSequence } from './invoice-sequence.entity';
import { InvoicesService } from './invoices.service';
import { Membership } from './membership.entity';
import { MembershipOfferPrice } from './membership-offer-price.entity';
import { MembershipOffer } from './membership-offer.entity';
import { MembershipOffersAdminController } from './membership-offers.admin.controller';
import { MembershipOffersService } from './membership-offers.service';
import { MembershipPlan } from './membership-plan.entity';
import { MembershipPlansService } from './membership-plans.service';
import { PaymentOrder } from './payment-order.entity';
import { MembershipWhatsAppService } from './membership-whatsapp.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    CouponsModule,
    SettingsModule,
    TypeOrmModule.forFeature([
      PaymentOrder,
      Membership,
      MembershipPlan,
      MembershipOffer,
      MembershipOfferPrice,
      TrialRegistration,
      User,
      Invoice,
      InvoiceSequence,
    ]),
  ],
  controllers: [PaymentsController, MembershipOffersAdminController],
  providers: [
    PaymentsService,
    MembershipPlansService,
    MembershipOffersService,
    InvoicesService,
    MembershipWhatsAppService,
  ],
  exports: [
    MembershipPlansService,
    MembershipOffersService,
    PaymentsService,
    InvoicesService,
  ],
})
export class PaymentsModule {}
