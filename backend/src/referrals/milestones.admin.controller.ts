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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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

  @Post('referral-milestones/:id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadMilestoneImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.milestones.setMilestoneImage(id, file);
  }

  @Delete('referral-milestones/:id/image')
  clearMilestoneImage(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestones.clearMilestoneImage(id);
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
