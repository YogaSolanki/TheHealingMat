import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  UpdateRedemptionDto,
} from './dto/milestone.dto';
import { MilestonesService } from './milestones.service';
import type { RedemptionStatus } from './reward-redemption-request.entity';

@Roles(Role.Admin)
@Controller('admin')
export class MilestonesAdminController {
  constructor(private readonly milestones: MilestonesService) {}

  @Get('referral-milestones')
  listMilestones() {
    return this.milestones.listAdminMilestones();
  }

  @Post('referral-milestones')
  createMilestone(@Body() dto: CreateMilestoneDto) {
    return this.milestones.createMilestone(dto);
  }

  @Patch('referral-milestones/:id')
  updateMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.milestones.updateMilestone(id, dto);
  }

  @Delete('referral-milestones/:id')
  removeMilestone(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestones.removeMilestone(id);
  }

  @Get('reward-redemptions')
  listRedemptions(@Query('status') status?: string) {
    const allowed: RedemptionStatus[] = ['pending', 'fulfilled', 'rejected'];
    const filter =
      status && allowed.includes(status as RedemptionStatus)
        ? (status as RedemptionStatus)
        : undefined;
    return this.milestones.listAdminRedemptions(filter);
  }

  @Patch('reward-redemptions/:id')
  updateRedemption(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRedemptionDto,
  ) {
    return this.milestones.updateRedemption(id, dto);
  }
}
