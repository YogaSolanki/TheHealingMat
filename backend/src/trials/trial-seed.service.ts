import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  cohortLabelForStart,
  nextFirstOrThirdMonday,
  trialEndsAtFromStart,
} from './cohort-schedule';
import { TrialCohort } from './trial-cohort.entity';

@Injectable()
export class TrialSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(TrialCohort)
    private readonly cohorts: Repository<TrialCohort>,
  ) {}

  async onModuleInit() {
    const now = new Date();
    const startsAt = nextFirstOrThirdMonday(now);
    const existing = await this.cohorts
      .createQueryBuilder('cohort')
      .where('cohort.startsAt = :startsAt', { startsAt })
      .getOne();
    if (existing) {
      if (!existing.isOpen) {
        existing.isOpen = true;
        await this.cohorts.save(existing);
      }
      return;
    }

    const openCount = await this.cohorts.count({ where: { isOpen: true } });
    if (openCount > 0) {
      return;
    }

    const endsAt = trialEndsAtFromStart(startsAt);
    await this.cohorts.save(
      this.cohorts.create({
        label: cohortLabelForStart(startsAt),
        startsAt,
        endsAt,
        registrationOpensAt: new Date(0),
        isOpen: true,
      }),
    );
  }
}
