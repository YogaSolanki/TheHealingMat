import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsModule } from '../coupons/coupons.module';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { Membership } from './membership.entity';
import { PaymentOrder } from './payment-order.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    CouponsModule,
    TypeOrmModule.forFeature([PaymentOrder, Membership, TrialRegistration]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
