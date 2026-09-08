import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CouponRedemption } from './coupon-redemption.entity';
import { Coupon, type CouponDiscountType } from './coupon.entity';
import {
  AssignCouponDto,
  CreateCouponDto,
  GenerateCouponDto,
  UpdateCouponDto,
} from './dto/coupon.dto';

export type CouponLifecycleStatus =
  | 'active'
  | 'exhausted'
  | 'expired'
  | 'inactive'
  | 'assigned';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
    @InjectRepository(CouponRedemption)
    private readonly redemptions: Repository<CouponRedemption>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list() {
    const rows = await this.coupons.find({
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toAdminCoupon(row));
  }

  async generate(dto: GenerateCouponDto) {
    const userName = dto.userName.trim().replace(/\s+/g, ' ');
    const discountType = dto.discountType;
    const discountValue = dto.discountValue;
    this.assertDiscount(discountType, discountValue);
    const maxUses = dto.maxUses ?? 1;
    this.assertMaxUses(maxUses);

    const discountLabel = this.buildDiscountLabel(discountType, discountValue);
    let code = this.buildCode(userName, discountType, discountValue);
    let attempts = 0;

    while (await this.coupons.exists({ where: { code } })) {
      attempts += 1;
      if (attempts > 12) {
        throw new ConflictException(
          'Unable to generate a unique coupon. Try again.',
        );
      }
      code = this.buildCode(userName, discountType, discountValue);
    }

    return {
      code,
      userName,
      discountType,
      discountValue,
      discountLabel,
      maxUses,
      expiresAt: dto.expiresAt ?? null,
    };
  }

  async create(dto: CreateCouponDto) {
    const userName = dto.userName.trim().replace(/\s+/g, ' ');
    const code = dto.code.trim().toUpperCase();
    const discountType = dto.discountType;
    const discountValue = dto.discountValue;
    this.assertDiscount(discountType, discountValue);
    const maxUses = dto.maxUses ?? 1;
    this.assertMaxUses(maxUses);

    const alreadyExists = await this.coupons.exists({ where: { code } });
    if (alreadyExists) {
      throw new ConflictException('This coupon code already exists.');
    }

    const discountLabel =
      dto.discountLabel.trim() ||
      this.buildDiscountLabel(discountType, discountValue);

    const coupon = this.coupons.create({
      code,
      userName,
      discountType,
      discountValue,
      discountLabel,
      maxUses,
      usageCount: 0,
      active: true,
      expiresAt: this.parseExpiresAt(dto.expiresAt),
      assignedUserId: null,
      assignedReferralCode: null,
    });
    return this.toAdminCoupon(await this.coupons.save(coupon));
  }

  findByCode(code: string) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return Promise.resolve(null);
    return this.coupons.findOne({ where: { code: normalized } });
  }

  /** Assigned coupons this member can still redeem. */
  async listMine(userId: string) {
    const rows = await this.coupons.find({
      where: { assignedUserId: userId },
      order: { createdAt: 'DESC' },
    });
    const usable: Coupon[] = [];
    for (const row of rows) {
      try {
        await this.assertRedeemable(row, userId);
        usable.push(row);
      } catch {
        /* hide used / expired / exhausted from member wallet */
      }
    }
    return usable.map((row) => this.toMemberCoupon(row));
  }

  async assign(id: string, dto: AssignCouponDto) {
    const coupon = await this.requireCoupon(id);
    if (coupon.usageCount > 0) {
      throw new BadRequestException(
        'This coupon has already been used and cannot be reassigned.',
      );
    }

    const referralCode = dto.referralCode.trim().toLowerCase();
    if (!referralCode) {
      throw new BadRequestException('Referral code is required.');
    }

    const user = await this.users.findOne({ where: { referralCode } });
    if (!user) {
      throw new NotFoundException('No member found with that referral code.');
    }

    // Assigned coupons are personal: default single-use for that member.
    const maxUses = dto.maxUses ?? 1;
    this.assertMaxUses(maxUses);

    coupon.assignedUserId = user.id;
    coupon.assignedReferralCode = user.referralCode;
    coupon.userName = user.fullName;
    coupon.maxUses = maxUses;
    return this.toAdminCoupon(await this.coupons.save(coupon));
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.requireCoupon(id);
    if (dto.active != null) coupon.active = dto.active;
    if (dto.maxUses != null) {
      this.assertMaxUses(dto.maxUses);
      if (dto.maxUses < coupon.usageCount) {
        throw new BadRequestException(
          `maxUses cannot be less than current usage (${coupon.usageCount}).`,
        );
      }
      coupon.maxUses = dto.maxUses;
    }
    if (dto.expiresAt !== undefined) {
      coupon.expiresAt = this.parseExpiresAt(dto.expiresAt);
    }
    return this.toAdminCoupon(await this.coupons.save(coupon));
  }

  async remove(id: string) {
    const coupon = await this.requireCoupon(id);
    await this.coupons.remove(coupon);
    return { success: true };
  }

  /**
   * Validate a coupon can be applied by this member right now.
   * Throws BadRequestException with a clear reason if not.
   */
  async assertRedeemable(coupon: Coupon, userId: string) {
    if (!coupon.active) {
      throw new BadRequestException('This coupon is no longer active.');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This coupon has expired.');
    }
    if (coupon.usageCount >= coupon.maxUses) {
      throw new BadRequestException(
        'This coupon has reached its usage limit.',
      );
    }
    if (coupon.assignedUserId && coupon.assignedUserId !== userId) {
      throw new BadRequestException(
        'This coupon is assigned to another member.',
      );
    }

    const alreadyUsed = await this.redemptions.exists({
      where: { couponId: coupon.id, userId },
    });
    if (alreadyUsed) {
      throw new BadRequestException('You have already used this coupon.');
    }

    return coupon;
  }

  /** Record a successful paid checkout that used this coupon. */
  async recordRedemption(input: {
    code: string | null | undefined;
    userId: string;
    paymentOrderId: string;
  }) {
    const code = input.code?.trim();
    if (!code) return null;

    const coupon = await this.findByCode(code);
    if (!coupon) return null;

    const existing = await this.redemptions.findOne({
      where: { couponId: coupon.id, userId: input.userId },
    });
    if (existing) return existing;

    // Re-check limits at write time (race-safe enough for this volume).
    await this.assertRedeemable(coupon, input.userId);

    const redemption = await this.redemptions.save(
      this.redemptions.create({
        couponId: coupon.id,
        userId: input.userId,
        paymentOrderId: input.paymentOrderId,
        couponCode: coupon.code,
      }),
    );

    coupon.usageCount += 1;
    if (coupon.usageCount >= coupon.maxUses) {
      coupon.active = false;
    }
    await this.coupons.save(coupon);
    return redemption;
  }

  private async requireCoupon(id: string) {
    const coupon = await this.coupons.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found.');
    return coupon;
  }

  private lifecycleStatus(coupon: Coupon): CouponLifecycleStatus {
    if (!coupon.active && coupon.usageCount >= coupon.maxUses) {
      return 'exhausted';
    }
    if (!coupon.active) return 'inactive';
    if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
      return 'expired';
    }
    if (coupon.usageCount >= coupon.maxUses) return 'exhausted';
    if (coupon.assignedUserId) return 'assigned';
    return 'active';
  }

  private toAdminCoupon(coupon: Coupon) {
    return {
      id: coupon.id,
      code: coupon.code,
      userName: coupon.userName,
      assignedUserId: coupon.assignedUserId,
      assignedReferralCode: coupon.assignedReferralCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountLabel: coupon.discountLabel,
      maxUses: coupon.maxUses,
      usageCount: coupon.usageCount,
      remainingUses: Math.max(0, coupon.maxUses - coupon.usageCount),
      active: coupon.active,
      expiresAt: coupon.expiresAt?.toISOString() ?? null,
      status: this.lifecycleStatus(coupon),
      createdAt: coupon.createdAt.toISOString(),
      updatedAt: coupon.updatedAt.toISOString(),
    };
  }

  private toMemberCoupon(coupon: Coupon) {
    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountLabel: coupon.discountLabel,
      maxUses: coupon.maxUses,
      usageCount: coupon.usageCount,
      expiresAt: coupon.expiresAt?.toISOString() ?? null,
    };
  }

  private parseExpiresAt(value?: string | null) {
    if (value == null || value === '') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid expiresAt date.');
    }
    return date;
  }

  private assertMaxUses(maxUses: number) {
    if (!Number.isInteger(maxUses) || maxUses < 1) {
      throw new BadRequestException('maxUses must be at least 1.');
    }
  }

  private assertDiscount(
    discountType: CouponDiscountType,
    discountValue: number,
  ) {
    if (discountType === 'percent' && discountValue > 100) {
      throw new BadRequestException('Percent off cannot be more than 100.');
    }
  }

  private buildDiscountLabel(
    discountType: CouponDiscountType,
    discountValue: number,
  ) {
    if (discountType === 'percent') {
      return `${discountValue}% OFF`;
    }
    return `${discountValue} OFF`;
  }

  private buildCode(
    userName: string,
    discountType: CouponDiscountType,
    discountValue: number,
  ) {
    const name =
      userName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 8) || 'USER';
    const unique = this.randomToken(3);
    const valuePart = String(discountValue);
    const typePart = discountType === 'percent' ? 'P' : '';
    return `${name}${unique}${valuePart}${typePart}`;
  }

  private randomToken(length: number) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i += 1) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
  }
}
