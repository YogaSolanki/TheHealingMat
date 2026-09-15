import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { SettingsService } from './settings.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly settings: SettingsService) {}

  /** Live class URL for authenticated members / trial users. */
  @Roles(Role.User)
  @Get('live')
  async getLive() {
    const url = await this.settings.getLiveSessionUrl();
    return { url };
  }
}
