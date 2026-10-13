import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { sendResendEmail } from '../mail/resend';
import { User } from '../users/user.entity';
import {
  CreateMilestoneDto,
  RedeemMilestoneDto,
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
  private readonly logger = new Logger(MilestonesService.name);

  constructor(
    @InjectRepository(ReferralMilestone)
    private readonly milestones: Repository<ReferralMilestone>,
    @InjectRepository(RewardRedemptionRequest)
    private readonly redemptions: Repository<RewardRedemptionRequest>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly referrals: ReferralsService,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (!existsSync(MILESTONE_UPLOAD_DIR)) {
      mkdirSync(MILESTONE_UPLOAD_DIR, { recursive: true });
    }

    try {
      await this.dataSource.query(`
        ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "deliveryEmail" varchar NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "deliveryAddress" text NULL
      `);
      // Migrate legacy users.address → deliveryAddress if present.
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'address'
          ) THEN
            UPDATE "users"
            SET "deliveryAddress" = COALESCE("deliveryAddress", "address")
            WHERE "address" IS NOT NULL AND ("deliveryAddress" IS NULL OR "deliveryAddress" = '');
            ALTER TABLE "users" DROP COLUMN IF EXISTS "address";
          END IF;
        END $$;
      `);
      await this.dataSource.query(`
        ALTER TABLE "reward_redemption_requests"
        ADD COLUMN IF NOT EXISTS "deliveryEmail" varchar NULL
      `);
      await this.dataSource.query(`
        ALTER TABLE "reward_redemption_requests"
        ADD COLUMN IF NOT EXISTS "deliveryAddress" text NULL
      `);
    } catch (err) {
      this.logger.warn(
        `Could not ensure delivery address columns: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
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

  async requestRedeem(
    user: User,
    milestoneId: string,
    dto: RedeemMilestoneDto = {},
  ) {
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

    const account = await this.users.findOne({ where: { id: user.id } });
    if (!account) throw new NotFoundException('Account not found.');

    const nextEmail =
      dto.email?.trim().toLowerCase() ||
      account.deliveryEmail?.trim().toLowerCase() ||
      null;
    const nextAddress =
      dto.address?.trim() || account.deliveryAddress?.trim() || null;

    if (!nextEmail) {
      throw new BadRequestException(
        'Email is required to deliver your reward. Please add your email address.',
      );
    }
    if (!nextAddress || nextAddress.length < 8) {
      throw new BadRequestException(
        'Full address is required to deliver your reward. Please add your delivery address.',
      );
    }

    // Saved only for redeem autofill — does not change account email / personal info.
    account.deliveryEmail = nextEmail;
    account.deliveryAddress = nextAddress;
    await this.users.save(account);

    const request = await this.redemptions.save(
      this.redemptions.create({
        userId: account.id,
        milestoneId: milestone.id,
        referralCount: milestone.referralCount,
        status: 'pending',
        deliveryEmail: nextEmail,
        deliveryAddress: nextAddress,
        adminNote: null,
        resolvedAt: null,
      }),
    );

    void this.notifyAdminOfRedemption({
      requestId: request.id,
      memberName: account.fullName,
      memberEmail: account.email,
      memberMobile: account.mobile,
      referralCode: account.referralCode,
      rewardTitle: milestone.rewardTitle,
      rewardDescription: milestone.rewardDescription,
      referralCount: milestone.referralCount,
      deliveryEmail: nextEmail,
      deliveryAddress: nextAddress,
      requestedAt: request.createdAt,
    }).catch((err) => {
      this.logger.warn(
        `Redeem admin email failed for ${request.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });

    return {
      id: request.id,
      milestoneId: request.milestoneId,
      referralCount: request.referralCount,
      status: request.status,
      deliveryEmail: request.deliveryEmail,
      deliveryAddress: request.deliveryAddress,
      createdAt: request.createdAt.toISOString(),
    };
  }

  private async notifyAdminOfRedemption(input: {
    requestId: string;
    memberName: string;
    memberEmail: string | null;
    memberMobile: string | null;
    referralCode: string;
    rewardTitle: string;
    rewardDescription: string;
    referralCount: number;
    deliveryEmail: string;
    deliveryAddress: string;
    requestedAt: Date;
  }) {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    if (!apiKey) {
      this.logger.warn(
        `[redeem-notify] Skipped for ${input.requestId}: RESEND_API_KEY not set`,
      );
      return;
    }

    const to =
      this.config.get<string>('REWARD_REDEEM_NOTIFY_EMAIL')?.trim() ||
      this.config.get<string>('CONTACT_TO_EMAIL')?.trim() ||
      'solankipr@gmail.com';
    const from =
      this.config.get<string>('RESEND_FROM_EMAIL')?.trim() ||
      'The Healing Mat <onboarding@resend.dev>';

    const when = input.requestedAt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `Reward redeem request: ${input.memberName} — ${input.rewardTitle}`;
    const text = [
      'New Milestones & Rewards redemption request',
      '',
      `Member: ${input.memberName}`,
      `Account email: ${input.memberEmail || '(none)'}`,
      `Mobile: ${input.memberMobile || '(none)'}`,
      `Referral code: ${input.referralCode}`,
      '',
      `Reward: ${input.rewardTitle}`,
      `Description: ${input.rewardDescription || '(none)'}`,
      `Milestone: ${input.referralCount} successful referrals`,
      '',
      `Delivery email: ${input.deliveryEmail}`,
      'Delivery address:',
      input.deliveryAddress,
      '',
      `Requested: ${when} IST`,
      `Request ID: ${input.requestId}`,
      '',
      'Open Admin → Rewards → Redemptions to fulfil or reject this request.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #243028;">
        <h2 style="color: #1f6b3a; margin: 0 0 12px;">New reward redeem request</h2>
        <p style="margin: 0 0 8px;"><strong>Member:</strong> ${escapeHtml(input.memberName)}</p>
        <p style="margin: 0 0 8px;"><strong>Account email:</strong> ${escapeHtml(input.memberEmail || '(none)')}</p>
        <p style="margin: 0 0 8px;"><strong>Mobile:</strong> ${escapeHtml(input.memberMobile || '(none)')}</p>
        <p style="margin: 0 0 16px;"><strong>Referral code:</strong> ${escapeHtml(input.referralCode)}</p>
        <p style="margin: 0 0 8px;"><strong>Reward:</strong> ${escapeHtml(input.rewardTitle)}</p>
        <p style="margin: 0 0 8px;"><strong>Description:</strong> ${escapeHtml(input.rewardDescription || '(none)')}</p>
        <p style="margin: 0 0 16px;"><strong>Milestone:</strong> ${input.referralCount} successful referrals</p>
        <p style="margin: 0 0 8px;"><strong>Delivery email:</strong> ${escapeHtml(input.deliveryEmail)}</p>
        <p style="margin: 0 0 6px;"><strong>Delivery address:</strong></p>
        <p style="white-space: pre-wrap; margin: 0 0 16px;">${escapeHtml(input.deliveryAddress)}</p>
        <p style="margin: 0 0 8px;"><strong>Requested:</strong> ${escapeHtml(when)} IST</p>
        <p style="font-size: 12px; color: #6b7c6e; margin: 0 0 12px;">Request ID: ${escapeHtml(input.requestId)}</p>
        <p style="margin: 0; font-size: 13px; color: #5f6f64;">Open Admin → Rewards → Redemptions to fulfil or reject this request.</p>
      </div>
    `;

    const payload = await sendResendEmail({
      apiKey,
      from,
      to,
      subject,
      text,
      html,
      replyTo: input.deliveryEmail,
    });

    this.logger.log(
      `[redeem-notify] Sent for ${input.requestId} via Resend (${payload.id ?? 'ok'}) to ${to}`,
    );
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
        deliveryEmail: row.deliveryEmail,
        deliveryAddress: row.deliveryAddress,
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
