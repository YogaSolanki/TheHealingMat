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
  CreateSessionTimingDto,
  UpdateSessionTimingDto,
} from './dto/session-timing.dto';
import { SessionTimingsService } from './session-timings.service';

@Roles(Role.Admin)
@Controller('admin/session-timings')
export class SessionTimingsAdminController {
  constructor(private readonly timings: SessionTimingsService) {}

  @Get()
  list(@Query('activeOnly') activeOnly?: string) {
    return this.timings.list(activeOnly !== '1' && activeOnly !== 'true');
  }

  @Post()
  create(@Body() dto: CreateSessionTimingDto) {
    return this.timings.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionTimingDto,
  ) {
    return this.timings.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.timings.remove(id);
  }
}
