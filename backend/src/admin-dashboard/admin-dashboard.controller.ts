import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AdminDashboardService } from './admin-dashboard.service';
import { CreateAdminMembershipDto } from './dto/create-admin-membership.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminMembershipDto } from './dto/update-admin-membership.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpgradeAdminMembershipDto } from './dto/upgrade-admin-membership.dto';

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

  @Get('users/exists')
  checkUserExists(
    @Query('mobile') mobile?: string,
    @Query('email') email?: string,
  ) {
    return this.dashboard.checkUserExists({ mobile, email });
  }

  @Post('users')
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.dashboard.createUser(dto);
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

  @Post('users/:id/memberships')
  createMembership(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAdminMembershipDto,
  ) {
    return this.dashboard.createMembership(id, dto);
  }

  @Get('users/:id/memberships/:membershipId/invoice')
  @Header('Content-Type', 'application/pdf')
  async downloadMembershipInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    const invoice = await this.dashboard.getMembershipInvoice(id, membershipId);
    return new StreamableFile(invoice.pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${invoice.filename}"`,
    });
  }

  @Post('users/:id/payments/:paymentOrderId/activate-membership')
  activateMembershipFromPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentOrderId', ParseUUIDPipe) paymentOrderId: string,
  ) {
    return this.dashboard.activateMembershipFromPayment(id, paymentOrderId);
  }

  @Post('users/:id/memberships/:membershipId/upgrade')
  upgradeMembership(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpgradeAdminMembershipDto,
  ) {
    return this.dashboard.upgradeMembership(id, membershipId, dto);
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
