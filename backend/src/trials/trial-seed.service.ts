import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrientationSlot } from './orientation-slot.entity';
import { TrialCohort } from './trial-cohort.entity';

@Injectable()
export class TrialSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(TrialCohort)
    private readonly cohorts: Repository<TrialCohort>,
    @InjectRepository(OrientationSlot)
    private readonly slots: Repository<OrientationSlot>,
  ) {}

  async onModuleInit() {
    const openCount = await this.cohorts.count({ where: { isOpen: true } });
    if (openCount > 0) {
      return;
    }

    const now = new Date();
    const startsAt = this.nextMonthStart(now);
    const endsAt = new Date(startsAt);
    endsAt.setUTCDate(endsAt.getUTCDate() + 14);

    const cohort = await this.cohorts.save(
      this.cohorts.create({
        label: `Trial Cohort ${startsAt.toISOString().slice(0, 7)}`,
        startsAt,
        endsAt,
        registrationOpensAt: now,
        isOpen: true,
      }),
    );

    const slotTimes = [
      { label: 'Orientation - Saturday 10:00 IST', dayOffset: 0, hour: 4, minute: 30 },
      { label: 'Orientation - Sunday 18:00 IST', dayOffset: 1, hour: 12, minute: 30 },
      { label: 'Orientation - Monday 08:00 IST', dayOffset: 2, hour: 2, minute: 30 },
    ];

    for (const slot of slotTimes) {
      const slotStart = new Date(startsAt);
      slotStart.setUTCDate(slotStart.getUTCDate() + slot.dayOffset);
      slotStart.setUTCHours(slot.hour, slot.minute, 0, 0);

      await this.slots.save(
        this.slots.create({
          cohortId: cohort.id,
          label: slot.label,
          startsAt: slotStart,
          capacity: 50,
          bookedCount: 0,
        }),
      );
    }
  }

  /** First day of next calendar month (UTC), V1: one cohort per month. */
  private nextMonthStart(from: Date): Date {
    const year = from.getUTCFullYear();
    const month = from.getUTCMonth() + 1;
    return new Date(Date.UTC(year, month, 1, 4, 30, 0, 0));
  }
}
