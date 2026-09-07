import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../users/user.entity';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class MemberCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  /** Coupons an admin assigned to this member. */
  @Roles(Role.User)
  @Get('me')
  async listMine(@CurrentUser() user: User) {
    const coupons = await this.coupons.listMine(user.id);
    return {
      coupons: coupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountLabel: coupon.discountLabel,
      })),
    };
  }
}
