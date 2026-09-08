import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Coupon } from './coupon.entity';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { MemberCouponsController } from './member-coupons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, User])],
  controllers: [CouponsController, MemberCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
