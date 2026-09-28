import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  UpdateScheduledTopicDto,
  UpsertScheduledTopicDto,
} from './dto/scheduled-topic.dto';
import { ScheduledTopicsService } from './scheduled-topics.service';

@Roles(Role.Admin)
@Controller('admin/session-topics')
export class SessionTopicsAdminController {
  constructor(private readonly topics: ScheduledTopicsService) {}

  @Get()
  list(@Query('from') from?: string) {
    return this.topics.list({ from: from?.trim() || undefined });
  }

  /** Create or replace the topic for a calendar date. */
  @Put()
  upsert(@Body() dto: UpsertScheduledTopicDto) {
    return this.topics.upsert(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduledTopicDto,
  ) {
    return this.topics.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.topics.remove(id);
  }
}
