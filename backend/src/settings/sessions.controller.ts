import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ScheduledClassesService } from './scheduled-classes.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly classes: ScheduledClassesService) {}

  /** Session times scheduled for today (from Class Management). */
  @Roles(Role.User)
  @Get('today')
  listToday() {
    return this.classes.listToday();
  }

  /**
   * Live class URL for authenticated members / trial users.
   * Uses current time + today's Class Management rows only.
   * Deleted / missing classes never return a join link.
   */
  @Roles(Role.User)
  @Get('live')
  getLive(@Query('at') at?: string) {
    return this.classes.findLiveSessionAt(at ?? null);
  }
}
