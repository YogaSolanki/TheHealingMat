import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../users/user.entity';
import { RegisterTrialDto } from './dto/register-trial.dto';
import { TrialsService } from './trials.service';

@Controller('trials')
export class TrialsController {
  constructor(private readonly trialsService: TrialsService) {}

  @Public()
  @Get('next-cohort')
  getNextCohort() {
    return this.trialsService.getNextCohort();
  }

  @Roles(Role.User)
  @Post('register')
  @HttpCode(201)
  register(@CurrentUser() user: User, @Body() dto: RegisterTrialDto) {
    return this.trialsService.register(user, dto);
  }

  @Roles(Role.User)
  @Get('me')
  me(@CurrentUser() user: User) {
    return this.trialsService.getMyTrial(user);
  }
}
