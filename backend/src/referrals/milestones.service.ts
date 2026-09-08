import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  UpdateRedemptionDto,
} from './dto/milestone.dto';
import { ReferralMilestone } from './referral-milestone.entity';
import { ReferralsService } from './referrals.service';
import {
  RedemptionStatus,
  RewardRedemptionRequest,
} from './reward-redemption-request.entity';

const DEFAULT_MILESTONES: {
  referralCount: number;
  rewardTitle: string;
  rewardDescription: string;
}[] = [
  {
    referralCount: 5,
    rewardTitle: 'Starter Wellness Gift',
    rewardDescription: 'A curated thank-you gift for your first 5 successful referrals.',
  },
  {
    referralCount: 10,
    rewardTitle: 'Healing Mat Bundle',
    rewardDescription: 'Exclusive merch bundle for reaching 10 successful referrals.',
  },
  {
    referralCount: 15,
    rewardTitle: 'Premium Wellness Pack',
    rewardDescription: 'A premium wellness pack for 15 successful referrals.',
  },
  {
    referralCount: 20,
    rewardTitle: 'VIP Member Gift',
    rewardDescription: 'VIP gift recognition for 20 successful referrals.',
  },
  {
    referralCount: 30,
    rewardTitle: 'Ambassador Kit',
    rewardDescription: 'Ambassador kit for 30 successful referrals.',
  },
  {
    referralCount: 40,
    rewardTitle: 'Elite Rewards Pack',
    rewardDescription: 'Elite rewards pack for 40 successful referrals.',
  },
  {
    referralCount: 50,
    rewardTitle: 'Founding Referrer Honour',
    rewardDescription: 'Special honour for 50 successful referrals.',
  },
];

export type MemberMilestoneStatus =
  | 'locked'
  | 'unlocked'
  | 'pending'
  | 'fulfilled'
  | 'rejected';

@Injectable()
export class MilestonesService implements OnModuleInit {
  constructor(
    @InjectRepository(ReferralMilestone)
    private readonly milestones: Repository<ReferralMilestone>,
    @InjectRepository(RewardRedemptionRequest)
    private readonly redemptions: Repository<RewardRedemptionRequest>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly referrals: ReferralsService,
  ) {}

  async onModuleInit() {
    const count = await this.milestones.count();
    if (count > 0) return;
    await this.milestones.save(
      DEFAULT_MILESTONES.map((row, index) =>
        this.milestones.create({
          ...row,
          active: true,
          sortOrder: index,
        }),
      ),
    );
  }

  async listAdminMilestones() {
    const rows = await this.milestones.find({
      order: { sortOrder: 'ASC', referralCount: 'ASC' },
    });
    return rows.map((row) => this.toAdminMilestone(row));
  }

  async createMilestone(dto: CreateMilestoneDto) {
    const existing = await this.milestones.findOne({
      where: { referralCount: dto.referralCount },
    });
    if (existing) {
      throw new BadRequestException(
        `A milestone for ${dto.referralCount} referrals already exists.`,
      );
    }
    const row = await this.milestones.save(
      this.milestones.create({
        referralCount: dto.referralCount,
        rewardTitle: dto.rewardTitle.trim(),
        rewardDescription: (dto.rewardDescription ?? '').trim(),
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? dto.referralCount,
      }),
    );
    return this.toAdminMilestone(row);
  }

  async updateMilestone(id: string, dto: UpdateMilestoneDto) {
    const row = await this.milestones.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Milestone not found.');

    if (dto.referralCount != null && dto.referralCount !== row.referralCount) {
      const clash = await this.milestones.findOne({
        where: { referralCount: dto.referralCount },
      });
      if (clash) {
        throw new BadRequestException(
          `A milestone for ${dto.referralCount} referrals already exists.`,
        );
      }
      row.referralCount = dto.referralCount;
    }
    if (dto.rewardTitle != null) row.rewardTitle = dto.rewardTitle.trim();
    if (dto.rewardDescription != null) {
      row.rewardDescription = dto.rewardDescription.trim();
    }
    if (dto.active != null) row.active = dto.active;
    if (dto.sortOrder != null) row.sortOrder = dto.sortOrder;

    return this.toAdminMilestone(await this.milestones.save(row));
  }

  async removeMilestone(id: string) {
    const row = await this.milestones.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Milestone not found.');
    const pending = await this.redemptions.count({
      where: { milestoneId: id, status: 'pending' },
    });
    if (pending > 0) {
      throw new BadRequestException(
        'Cannot delete a milestone with pending redemption requests. Resolve them first.',
      );
    }
    await this.milestones.remove(row);
    return { success: true };
  }

  async listMemberMilestones(user: User) {
    const [{ successfulCount }, milestones, requests] = await Promise.all([
      this.referrals.listMine(user),
      this.milestones.find({
        where: { active: true },
        order: { sortOrder: 'ASC', referralCount: 'ASC' },
      }),
      this.redemptions.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const latestByMilestone = new Map<string, RewardRedemptionRequest>();
    for (const request of requests) {
      if (!latestByMilestone.has(request.milestoneId)) {
        latestByMilestone.set(request.milestoneId, request);
      }
    }

    return {
      successfulCount,
      milestones: milestones.map((milestone) => {
        const request = latestByMilestone.get(milestone.id) ?? null;
        const status = this.memberStatus(
          successfulCount,
          milestone.referralCount,
          request,
        );
        return {
          id: milestone.id,
          referralCount: milestone.referralCount,
          rewardTitle: milestone.rewardTitle,
          rewardDescription: milestone.rewardDescription,
          status,
          canRedeem: status === 'unlocked',
          requestId: request?.id ?? null,
          requestedAt: request?.createdAt?.toISOString() ?? null,
        };
      }),
    };
  }

  async requestRedeem(user: User, milestoneId: string) {
    const milestone = await this.milestones.findOne({
      where: { id: milestoneId, active: true },
    });
    if (!milestone) throw new NotFoundException('Milestone not found.');

    const { successfulCount } = await this.referrals.listMine(user);
    if (successfulCount < milestone.referralCount) {
      throw new BadRequestException(
        `You need ${milestone.referralCount} successful referrals to redeem this reward.`,
      );
    }

    const existing = await this.redemptions.findOne({
      where: { userId: user.id, milestoneId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException(
        'You already have a pending redemption request for this milestone.',
      );
    }

    const fulfilled = await this.redemptions.findOne({
      where: { userId: user.id, milestoneId, status: 'fulfilled' },
    });
    if (fulfilled) {
      throw new BadRequestException('This reward has already been fulfilled.');
    }

    const request = await this.redemptions.save(
      this.redemptions.create({
        userId: user.id,
        milestoneId: milestone.id,
        referralCount: milestone.referralCount,
        status: 'pending',
        adminNote: null,
        resolvedAt: null,
      }),
    );

    return {
      id: request.id,
      milestoneId: request.milestoneId,
      referralCount: request.referralCount,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async listAdminRedemptions(status?: RedemptionStatus) {
    const rows = await this.redemptions.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((row) => row.userId))];
    const milestoneIds = [...new Set(rows.map((row) => row.milestoneId))];
    const [users, milestones] = await Promise.all([
      this.users.find({ where: { id: In(userIds) } }),
      this.milestones.find({ where: { id: In(milestoneIds) } }),
    ]);
    const userById = new Map(users.map((user) => [user.id, user]));
    const milestoneById = new Map(
      milestones.map((milestone) => [milestone.id, milestone]),
    );

    return rows.map((row) => {
      const user = userById.get(row.userId);
      const milestone = milestoneById.get(row.milestoneId);
      return {
        id: row.id,
        status: row.status,
        referralCount: row.referralCount,
        adminNote: row.adminNote,
        createdAt: row.createdAt.toISOString(),
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
        user: user
          ? {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              mobile: user.mobile,
              referralCode: user.referralCode,
            }
          : null,
        milestone: milestone
          ? {
              id: milestone.id,
              referralCount: milestone.referralCount,
              rewardTitle: milestone.rewardTitle,
              rewardDescription: milestone.rewardDescription,
            }
          : {
              id: row.milestoneId,
              referralCount: row.referralCount,
              rewardTitle: 'Removed milestone',
              rewardDescription: '',
            },
      };
    });
  }

  async updateRedemption(id: string, dto: UpdateRedemptionDto) {
    const row = await this.redemptions.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Redemption request not found.');

    row.status = dto.status;
    if (dto.adminNote != null) row.adminNote = dto.adminNote.trim() || null;
    row.resolvedAt =
      dto.status === 'pending' ? null : row.resolvedAt ?? new Date();
    if (dto.status === 'pending') row.resolvedAt = null;

    await this.redemptions.save(row);
    const list = await this.listAdminRedemptions();
    const refreshed = list.find((entry) => entry.id === id);
    if (!refreshed) throw new NotFoundException('Redemption request not found.');
    return refreshed;
  }

  private memberStatus(
    successfulCount: number,
    referralCount: number,
    request: RewardRedemptionRequest | null,
  ): MemberMilestoneStatus {
    if (request?.status === 'fulfilled') return 'fulfilled';
    if (request?.status === 'pending') return 'pending';
    if (request?.status === 'rejected') {
      // Allow re-request after rejection once still eligible.
      return successfulCount >= referralCount ? 'unlocked' : 'locked';
    }
    if (successfulCount >= referralCount) return 'unlocked';
    return 'locked';
  }

  private toAdminMilestone(row: ReferralMilestone) {
    return {
      id: row.id,
      referralCount: row.referralCount,
      rewardTitle: row.rewardTitle,
      rewardDescription: row.rewardDescription,
      active: row.active,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
