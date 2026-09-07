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
import { Coupon, type CouponDiscountType } from './coupon.entity';
import {
  AssignCouponDto,
  CreateCouponDto,
  GenerateCouponDto,
} from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  list() {
    return this.coupons.find({
      order: { createdAt: 'DESC' },
    });
  }

  async generate(dto: GenerateCouponDto) {
    const userName = dto.userName.trim().replace(/\s+/g, ' ');
    const discountType = dto.discountType;
    const discountValue = dto.discountValue;
    this.assertDiscount(discountType, discountValue);

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
    };
  }

  async create(dto: CreateCouponDto) {
    const userName = dto.userName.trim().replace(/\s+/g, ' ');
    const code = dto.code.trim().toUpperCase();
    const discountType = dto.discountType;
    const discountValue = dto.discountValue;
    this.assertDiscount(discountType, discountValue);

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
      assignedUserId: null,
      assignedReferralCode: null,
    });
    return this.coupons.save(coupon);
  }

  findByCode(code: string) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return Promise.resolve(null);
    return this.coupons.findOne({ where: { code: normalized } });
  }

  /** Coupons locked to this member (admin-assigned via referral code). */
  listMine(userId: string) {
    return this.coupons.find({
      where: { assignedUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async assign(id: string, dto: AssignCouponDto) {
    const coupon = await this.coupons.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }

    const referralCode = dto.referralCode.trim().toLowerCase();
    if (!referralCode) {
      throw new BadRequestException('Referral code is required.');
    }

    const user = await this.users.findOne({ where: { referralCode } });
    if (!user) {
      throw new NotFoundException(
        'No member found with that referral code.',
      );
    }

    coupon.assignedUserId = user.id;
    coupon.assignedReferralCode = user.referralCode;
    coupon.userName = user.fullName;
    return this.coupons.save(coupon);
  }

  async remove(id: string) {
    const coupon = await this.coupons.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }
    await this.coupons.remove(coupon);
    return { success: true };
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

  /**
   * Readable unique code from name + offer, e.g. SONUXQU100 or SONUK2M50P
   */
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
