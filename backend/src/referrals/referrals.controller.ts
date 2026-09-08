import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../users/user.entity';
import { MilestonesService } from './milestones.service';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly referrals: ReferralsService,
    private readonly milestones: MilestonesService,
  ) {}

  @Roles(Role.User)
  @Get('me')
  listMine(@CurrentUser() user: User) {
    return this.referrals.listMine(user);
  }

  @Roles(Role.User)
  @Get('milestones')
  listMilestones(@CurrentUser() user: User) {
    return this.milestones.listMemberMilestones(user);
  }

  @Roles(Role.User)
  @Post('milestones/:id/redeem')
  redeem(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.milestones.requestRedeem(user, id);
  }
}
