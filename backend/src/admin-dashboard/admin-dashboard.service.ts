import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrientationSlot } from '../trials/orientation-slot.entity';
import { TrialCohort } from '../trials/trial-cohort.entity';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { Region } from '../users/enums/region.enum';
import { TrialStatus } from '../users/enums/trial-status.enum';
import { User } from '../users/user.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(TrialRegistration)
    private readonly trials: Repository<TrialRegistration>,
    @InjectRepository(TrialCohort)
    private readonly cohorts: Repository<TrialCohort>,
    @InjectRepository(OrientationSlot)
    private readonly slots: Repository<OrientationSlot>,
  ) {}

  async getOverview() {
    const now = new Date();

    const [
      totalUsers,
      indiaUsers,
      outsideUsers,
      trialUsed,
      scheduled,
      active,
      completedOrExpired,
      recentUsers,
      recentTrials,
      nextCohort,
      signupsByDay,
    ] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { region: Region.India } }),
      this.users.count({ where: { region: Region.OutsideIndia } }),
      this.users.count({ where: { hasUsedFreeTrial: true } }),
      this.trials.count({ where: { status: TrialStatus.Scheduled } }),
      this.trials.count({ where: { status: TrialStatus.Active } }),
      this.trials
        .createQueryBuilder('t')
        .where('t.status IN (:...statuses)', {
          statuses: [TrialStatus.Completed, TrialStatus.Expired],
        })
        .getCount(),
      this.users.find({
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.trials.find({
        relations: { user: true, cohort: true, orientationSlot: true },
        order: { registeredAt: 'DESC' },
        take: 6,
      }),
      this.cohorts
        .createQueryBuilder('cohort')
        .leftJoinAndSelect('cohort.orientationSlots', 'slot')
        .where('cohort.isOpen = :isOpen', { isOpen: true })
        .andWhere('cohort.endsAt > :now', { now })
        .orderBy('cohort.startsAt', 'ASC')
        .addOrderBy('slot.startsAt', 'ASC')
        .getOne(),
      this.getSignupsLast7Days(),
    ]);

    const orientationBooked = nextCohort
      ? (nextCohort.orientationSlots ?? []).reduce(
          (sum, slot) => sum + slot.bookedCount,
          0,
        )
      : 0;
    const orientationCapacity = nextCohort
      ? (nextCohort.orientationSlots ?? []).reduce(
          (sum, slot) => sum + slot.capacity,
          0,
        )
      : 0;

    return {
      stats: {
        totalUsers,
        indiaUsers,
        outsideUsers,
        trialUsed,
        trials: {
          scheduled,
          active,
          completedOrExpired,
        },
      },
      signupsLast7Days: signupsByDay,
      nextCohort: nextCohort
        ? {
            id: nextCohort.id,
            label: nextCohort.label,
            startsAt: nextCohort.startsAt,
            endsAt: nextCohort.endsAt,
            orientationBooked,
            orientationCapacity,
            seatsLeft: Math.max(0, orientationCapacity - orientationBooked),
          }
        : null,
      recentUsers: recentUsers.map((user) => this.toUserRow(user)),
      recentTrials: recentTrials.map((trial) => ({
        id: trial.id,
        status: trial.status,
        registeredAt: trial.registeredAt,
        trialStartsAt: trial.trialStartsAt,
        trialEndsAt: trial.trialEndsAt,
        user: {
          id: trial.user.id,
          fullName: trial.user.fullName,
          region: trial.user.region,
          mobile: trial.user.mobile,
          email: trial.user.email,
        },
        cohortLabel: trial.cohort?.label ?? null,
        orientationLabel: trial.orientationSlot?.label ?? null,
      })),
    };
  }

  async listUsers() {
    const users = await this.users.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });

    if (users.length === 0) {
      return { users: [] };
    }

    const trials = await this.trials.find({
      where: { userId: In(users.map((u) => u.id)) },
      relations: { cohort: true, orientationSlot: true },
    });

    const trialByUser = new Map(trials.map((t) => [t.userId, t]));

    return {
      users: users.map((user) => {
        const trial = trialByUser.get(user.id);
        return {
          ...this.toUserRow(user),
          trial: trial
            ? {
                status: trial.status,
                trialStartsAt: trial.trialStartsAt,
                trialEndsAt: trial.trialEndsAt,
                cohortLabel: trial.cohort?.label ?? null,
                orientationLabel: trial.orientationSlot?.label ?? null,
              }
            : null,
        };
      }),
    };
  }

  private toUserRow(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      region: user.region,
      mobile: user.mobile,
      email: user.email,
      referralCode: user.referralCode,
      hasUsedFreeTrial: user.hasUsedFreeTrial,
      createdAt: user.createdAt,
    };
  }

  private async getSignupsLast7Days() {
    const days: { date: string; label: string; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);

      const count = await this.users
        .createQueryBuilder('user')
        .where('user.createdAt >= :start AND user.createdAt < :end', {
          start: day,
          end: next,
        })
        .getCount();

      days.push({
        date: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }

    return days;
  }
}
