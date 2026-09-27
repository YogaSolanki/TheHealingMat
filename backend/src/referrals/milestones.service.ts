import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
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
    rewardDescription:
      'A curated thank-you gift for your first 5 successful referrals.',
  },
  {
    referralCount: 10,
    rewardTitle: 'Healing Mat Bundle',
    rewardDescription:
      'Exclusive merch bundle for reaching 10 successful referrals.',
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

const MILESTONE_UPLOAD_DIR = join(process.cwd(), 'uploads', 'milestones');
const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

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
    if (!existsSync(MILESTONE_UPLOAD_DIR)) {
      mkdirSync(MILESTONE_UPLOAD_DIR, { recursive: true });
    }

    const count = await this.milestones.count();
    if (count > 0) return;
    await this.milestones.save(
      DEFAULT_MILESTONES.map((row, index) =>
        this.milestones.create({
          ...row,
          imageUrl: null,
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
        imageUrl: this.normalizeImageUrl(dto.imageUrl),
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
    if (dto.imageUrl !== undefined) {
      const next = this.normalizeImageUrl(dto.imageUrl);
      if (next !== row.imageUrl) {
        this.deleteLocalImage(row.imageUrl);
        row.imageUrl = next;
      }
    }
    if (dto.active != null) row.active = dto.active;
    if (dto.sortOrder != null) row.sortOrder = dto.sortOrder;

    return this.toAdminMilestone(await this.milestones.save(row));
  }

  async setMilestoneImage(id: string, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    const ext = extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_IMAGE_EXT.has(ext)) {
      throw new BadRequestException(
        'Upload a JPG, PNG, WEBP, or GIF image.',
      );
    }

    const row = await this.milestones.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Milestone not found.');

    if (!existsSync(MILESTONE_UPLOAD_DIR)) {
      mkdirSync(MILESTONE_UPLOAD_DIR, { recursive: true });
    }

    const filename = `${randomUUID()}${ext}`;
    const absolutePath = join(MILESTONE_UPLOAD_DIR, filename);
    writeFileSync(absolutePath, file.buffer);

    this.deleteLocalImage(row.imageUrl);
    row.imageUrl = `/uploads/milestones/${filename}`;
    return this.toAdminMilestone(await this.milestones.save(row));
  }

  async clearMilestoneImage(id: string) {
    const row = await this.milestones.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Milestone not found.');
    this.deleteLocalImage(row.imageUrl);
    row.imageUrl = null;
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
    this.deleteLocalImage(row.imageUrl);
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
          imageUrl: milestone.imageUrl,
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
              imageUrl: milestone.imageUrl,
            }
          : {
              id: row.milestoneId,
              referralCount: row.referralCount,
              rewardTitle: 'Removed milestone',
              rewardDescription: '',
              imageUrl: null as string | null,
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
      imageUrl: row.imageUrl,
      active: row.active,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private normalizeImageUrl(value?: string | null) {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private deleteLocalImage(imageUrl: string | null | undefined) {
    if (!imageUrl?.startsWith('/uploads/milestones/')) return;
    const filename = imageUrl.slice('/uploads/milestones/'.length);
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return;
    }
    const absolutePath = join(MILESTONE_UPLOAD_DIR, filename);
    try {
      if (existsSync(absolutePath)) unlinkSync(absolutePath);
    } catch {
      // Ignore cleanup failures for missing/locked files.
    }
  }
}
