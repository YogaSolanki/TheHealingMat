import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ScheduledClassesService } from './scheduled-classes.service';
import { SettingsService } from './settings.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly classes: ScheduledClassesService,
  ) {}

  /** Session times scheduled for today (from Class Management). */
  @Roles(Role.User)
  @Get('today')
  listToday() {
    return this.classes.listToday();
  }

  /** Live class URL for authenticated members / trial users. */
  @Roles(Role.User)
  @Get('live')
  async getLive(@Query('slot') slot?: string) {
    const scheduled = await this.classes.findLiveMeetingUrl(slot ?? null);
    if (scheduled) return { url: scheduled };

    const url = await this.settings.getLiveSessionUrl();
    return { url };
  }
}
