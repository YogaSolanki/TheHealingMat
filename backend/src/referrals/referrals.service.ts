import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Membership } from '../payments/membership.entity';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { User } from '../users/user.entity';

export type ReferralStatus =
  | 'SUCCESSFUL'
  | 'TRIAL'
  | 'MEMBERSHIP PENDING'
  | 'REGISTERED';

export type ReferralListItem = {
  id: string;
  fullName: string;
  status: ReferralStatus;
  note: string;
  referredOn: string;
};

const STATUS_NOTE: Record<ReferralStatus, string> = {
  SUCCESSFUL: 'Successfully joined',
  TRIAL: '14-day trial in progress',
  'MEMBERSHIP PENDING': 'Registered, membership pending',
  REGISTERED: 'Registered',
};

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
    @InjectRepository(TrialRegistration)
    private readonly trials: Repository<TrialRegistration>,
  ) {}

  async listMine(referrer: User) {
    const referred = await this.users.find({
      where: { referredByUserId: referrer.id },
      order: { createdAt: 'DESC' },
    });

    if (referred.length === 0) {
      return { successfulCount: 0, referrals: [] as ReferralListItem[] };
    }

    const ids = referred.map((user) => user.id);
    const [membershipRows, trialRows] = await Promise.all([
      this.memberships.find({ where: { userId: In(ids) } }),
      this.trials.find({ where: { userId: In(ids) } }),
    ]);

    const membershipsByUser = new Map<string, Membership[]>();
    for (const row of membershipRows) {
      const list = membershipsByUser.get(row.userId) ?? [];
      list.push(row);
      membershipsByUser.set(row.userId, list);
    }

    const trialByUser = new Map(
      trialRows.map((trial) => [trial.userId, trial] as const),
    );

    const now = new Date();
    const referrals = referred.map((user) => {
      const status = this.resolveStatus(
        membershipsByUser.get(user.id) ?? [],
        trialByUser.get(user.id) ?? null,
        now,
      );
      return {
        id: user.id,
        fullName: user.fullName,
        status,
        note: STATUS_NOTE[status],
        referredOn: user.createdAt.toISOString(),
      } satisfies ReferralListItem;
    });

    const successfulCount = referrals.filter(
      (row) => row.status === 'SUCCESSFUL',
    ).length;

    return { successfulCount, referrals };
  }

  private resolveStatus(
    memberships: Membership[],
    trial: TrialRegistration | null,
    now: Date,
  ): ReferralStatus {
    if (memberships.some((row) => row.amountPaidPaise > 0)) {
      return 'SUCCESSFUL';
    }

    if (
      trial &&
      now >= trial.trialStartsAt &&
      now <= trial.trialEndsAt
    ) {
      return 'TRIAL';
    }

    if (memberships.length > 0) {
      return 'MEMBERSHIP PENDING';
    }

    return 'REGISTERED';
  }
}
