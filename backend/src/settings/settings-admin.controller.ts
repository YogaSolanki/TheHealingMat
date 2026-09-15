import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SettingsService } from './settings.service';

@Roles(Role.Admin)
@Controller('admin/settings')
export class SettingsAdminController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.getAdminSettings();
  }

  @Patch()
  update(@Body() dto: UpdateSiteSettingsDto) {
    return this.settings.updateSettings(dto);
  }
}
