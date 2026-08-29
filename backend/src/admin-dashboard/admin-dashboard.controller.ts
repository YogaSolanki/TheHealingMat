import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin')
@Roles(Role.Admin)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('dashboard')
  overview() {
    return this.dashboard.getOverview();
  }

  @Get('users')
  users() {
    return this.dashboard.listUsers();
  }
}
