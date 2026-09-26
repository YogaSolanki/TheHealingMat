import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AdminDashboardService } from './admin-dashboard.service';
import { UpdateAdminMembershipDto } from './dto/update-admin-membership.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

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

  @Get('users/:id')
  userDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.dashboard.getUserDetail(id);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.dashboard.updateUser(id, dto);
  }

  @Patch('users/:id/memberships/:membershipId')
  updateMembership(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpdateAdminMembershipDto,
  ) {
    return this.dashboard.updateMembership(id, membershipId, dto);
  }

  @Delete('users')
  deleteAllUsers() {
    return this.dashboard.deleteAllUsers();
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.dashboard.deleteUser(id);
  }
}
