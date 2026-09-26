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
  CreateScheduledClassDto,
  UpdateScheduledClassDto,
} from './dto/scheduled-class.dto';
import { ScheduledClassesService } from './scheduled-classes.service';

@Roles(Role.Admin)
@Controller('admin/classes')
export class ClassesAdminController {
  constructor(private readonly classes: ScheduledClassesService) {}

  @Get()
  list(@Query('from') from?: string) {
    return this.classes.list({ from: from?.trim() || undefined });
  }

  @Post()
  create(@Body() dto: CreateScheduledClassDto) {
    return this.classes.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduledClassDto,
  ) {
    return this.classes.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.classes.remove(id);
  }
}
