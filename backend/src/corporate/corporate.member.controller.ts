import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../users/user.entity';
import { CorporateService } from './corporate.service';
import {
  InspectCorporateCouponDto,
  RequestCorporateCouponOtpDto,
  VerifyCorporateCouponOtpDto,
} from './dto/corporate.dto';

@Controller('memberships/corporate-coupon')
export class CorporateMemberController {
  constructor(private readonly corporate: CorporateService) {}

  @Roles(Role.User)
  @Post('inspect')
  inspect(
    @CurrentUser() user: User,
    @Body() dto: InspectCorporateCouponDto,
  ) {
    return this.corporate.inspectCorporateCoupon(user.id, dto.couponCode);
  }

  @Roles(Role.User)
  @Post('request-otp')
  requestOtp(
    @CurrentUser() user: User,
    @Body() dto: RequestCorporateCouponOtpDto,
  ) {
    return this.corporate.requestCouponDomainOtp(user.id, dto);
  }

  @Roles(Role.User)
  @Post('verify-otp')
  verifyOtp(
    @CurrentUser() user: User,
    @Body() dto: VerifyCorporateCouponOtpDto,
  ) {
    return this.corporate.verifyCouponDomainOtp(user.id, dto);
  }
}
