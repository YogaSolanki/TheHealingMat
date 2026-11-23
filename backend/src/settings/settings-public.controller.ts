import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { SettingsService } from './settings.service';

/** Public site flags for marketing / auth UI (no secrets). */
@Public()
@Controller('settings/public')
export class SettingsPublicController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.getPublicSettings();
  }
}
