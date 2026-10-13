import { Controller, Get, Inject, Query, forwardRef } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { PaymentsService } from '../payments/payments.service';
import { User } from '../users/user.entity';
import {
  ScheduledClassesService,
  type SessionAudience,
} from './scheduled-classes.service';
import { ScheduledTopicsService } from './scheduled-topics.service';

function audienceFromAccessState(
  state: string | null | undefined,
): SessionAudience {
  if (state === 'trial' || state === 'scheduled') return 'trial';
  return 'member';
}

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly classes: ScheduledClassesService,
    private readonly topics: ScheduledTopicsService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly payments: PaymentsService,
  ) {}

  /** Session times scheduled for today (from Class Management). */
  @Roles(Role.User)
  @Get('today')
  async listToday(@CurrentUser() user: User) {
    const access = await this.payments.getMyAccess(user);
    const audience = audienceFromAccessState(access.state);
    const [today, topics] = await Promise.all([
      this.classes.listToday(audience),
      this.topics.getTodayAndTomorrow(),
    ]);
    return { ...today, ...topics, audience };
  }

  /**
   * Live class URL for authenticated members / trial users.
   * Uses current time + today's Class Management rows only.
   * Deleted / missing classes never return a join link.
   * Trial users join trial slots; members join membership slots.
   */
  @Roles(Role.User)
  @Get('live')
  async getLive(@CurrentUser() user: User, @Query('at') at?: string) {
    const access = await this.payments.getMyAccess(user);
    const audience = audienceFromAccessState(access.state);
    return this.classes.findLiveSessionAt(at ?? null, audience);
  }
}
