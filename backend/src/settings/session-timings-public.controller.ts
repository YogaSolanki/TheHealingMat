import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { SessionTimingsService } from './session-timings.service';

/** Active class start times for member UI, checkout, and marketing. */
@Public()
@Controller('session-timings')
export class SessionTimingsPublicController {
  constructor(private readonly timings: SessionTimingsService) {}

  @Get()
  list() {
    return this.timings.list(false);
  }
}
