import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { Repository } from 'typeorm';
import { CouponsService } from '../coupons/coupons.service';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { TrialStatus } from '../users/enums/trial-status.enum';
import { User } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { QuoteMembershipDto } from './dto/quote-membership.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { Membership } from './membership.entity';
import { MembershipPlan } from './membership-plan.entity';
import { REFERRAL_DISCOUNT_PERCENT } from './membership-plans';
import { MembershipOffersService } from './membership-offers.service';
import { MembershipPlansService } from './membership-plans.service';
import { PaymentOrder } from './payment-order.entity';

const MIN_ORDER_PAISE = 100;

@Injectable()
export class PaymentsService {
  private readonly razorpay: Razorpay | null;

  constructor(
    private readonly config: ConfigService,
    private readonly coupons: CouponsService,
    private readonly membershipPlans: MembershipPlansService,
    private readonly membershipOffers: MembershipOffersService,
    @InjectRepository(PaymentOrder)
    private readonly orders: Repository<PaymentOrder>,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
    @InjectRepository(TrialRegistration)
    private readonly trials: Repository<TrialRegistration>,
  ) {
    const keyId = this.keyId();
    const keySecret = this.keySecret();
    this.razorpay =
      keyId && keySecret
        ? new Razorpay({ key_id: keyId, key_secret: keySecret })
        : null;
  }

  async listPlans() {
    return this.membershipPlans.listPublic();
  }

  async quote(user: User, dto: QuoteMembershipDto) {
    const quote = await this.buildQuote(user, dto.planMonths, dto.couponCode);
    return this.toQuoteResponse(quote);
  }

  async createOrder(user: User, dto: CreateOrderDto) {
    const startMode = dto.startMode ?? 'now';
    await this.assertCanPurchase(user.id);

    if (dto.planMonths != null) {
      const quote = await this.buildQuote(user, dto.planMonths, dto.couponCode);
      if (quote.amountPaise === 0) {
        const membership = await this.fulfillZeroAmount(user, quote, startMode);
        return {
          skipCheckout: true as const,
          order_id: null,
          amount: 0,
          currency: 'INR',
          key_id: this.requireKeyId(),
          membership: this.toPublicMembership(membership),
        };
      }

      const order = await this.createRazorpayOrder({
        amountPaise: quote.amountPaise,
        currency: dto.currency ?? 'INR',
        receipt: dto.receipt,
        notes: {
          userId: user.id,
          planMonths: String(quote.plan.months),
        },
      });

      await this.orders.save(
        this.orders.create({
          userId: user.id,
          razorpayOrderId: order.id,
          amountPaise: quote.amountPaise,
          currency: order.currency,
          receipt: String(order.receipt ?? this.makeReceipt()),
          planMonths: quote.plan.months,
          couponCode: quote.couponCode,
          startMode,
          listPricePaise: quote.listPricePaise,
          discountPaise: quote.discountPaise,
          status: 'created',
        }),
      );

      return {
        skipCheckout: false as const,
        order_id: order.id,
        amount: quote.amountPaise,
        currency: order.currency,
        key_id: this.requireKeyId(),
      };
    }

    const amountPaise = dto.amount;
    if (amountPaise == null) {
      throw new BadRequestException(
        'Provide planMonths for a membership, or amount in paise.',
      );
    }
    if (amountPaise < MIN_ORDER_PAISE) {
      throw new BadRequestException('amount must be at least 100 paise');
    }

    const order = await this.createRazorpayOrder({
      amountPaise,
      currency: dto.currency ?? 'INR',
      receipt: dto.receipt,
      notes: { userId: user.id },
    });

    await this.orders.save(
      this.orders.create({
        userId: user.id,
        razorpayOrderId: order.id,
        amountPaise,
        currency: order.currency,
        receipt: String(order.receipt ?? this.makeReceipt()),
        planMonths: null,
        couponCode: null,
        startMode,
        listPricePaise: amountPaise,
        discountPaise: 0,
        status: 'created',
      }),
    );

    return {
      skipCheckout: false as const,
      order_id: order.id,
      amount: amountPaise,
      currency: order.currency,
      key_id: this.requireKeyId(),
    };
  }

  async verifyPayment(user: User, dto: VerifyPaymentDto) {
    const order = await this.orders.findOne({
      where: { razorpayOrderId: dto.razorpay_order_id, userId: user.id },
    });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    const valid = this.signaturesMatch(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );
    if (!valid) {
      order.status = 'failed';
      await this.orders.save(order);
      throw new BadRequestException('Payment signature mismatch.');
    }

    if (order.status === 'paid') {
      const existing = await this.memberships.findOne({
        where: { paymentOrderId: order.id },
      });
      return {
        success: true,
        membership: existing ? this.toPublicMembership(existing) : null,
      };
    }

    order.status = 'paid';
    order.razorpayPaymentId = dto.razorpay_payment_id;
    await this.orders.save(order);

    const membership =
      order.planMonths != null
        ? await this.activateMembership(user, order)
        : null;

    return {
      success: true,
      membership: membership ? this.toPublicMembership(membership) : null,
    };
  }

  async getMyAccess(user: User) {
    await this.expireEnded(user.id);
    const now = new Date();
    const rows = await this.memberships.find({
      where: { userId: user.id },
      order: { startsAt: 'DESC' },
    });
    const current =
      rows.find((row) => row.status === 'active' && row.endsAt >= now) ?? null;
    const scheduled =
      rows.find((row) => row.status === 'scheduled' && row.startsAt > now) ??
      null;
    const trial = await this.trials.findOne({ where: { userId: user.id } });
    if (trial) {
      const nowMs = now.getTime();
      if (nowMs > trial.trialEndsAt.getTime()) {
        if (trial.status !== TrialStatus.Expired) {
          trial.status = TrialStatus.Expired;
          await this.trials.save(trial);
        }
      } else if (nowMs >= trial.trialStartsAt.getTime()) {
        if (trial.status !== TrialStatus.Active) {
          trial.status = TrialStatus.Active;
          await this.trials.save(trial);
        }
      }
    }

    const trialActive =
      trial && now >= trial.trialStartsAt && now <= trial.trialEndsAt
        ? trial
        : null;

    const lastExpired =
      rows.find((row) => row.status === 'expired') ?? null;

    let state: 'trial' | 'active' | 'expired' = 'expired';
    if (current) state = 'active';
    else if (trialActive) state = 'trial';

    return {
      state,
      current: current ? this.toPublicMembership(current) : null,
      scheduled: scheduled ? this.toPublicMembership(scheduled) : null,
      lastExpired: lastExpired ? this.toPublicMembership(lastExpired) : null,
      trial: trial
        ? {
            startsAt: trial.trialStartsAt.toISOString(),
            endsAt: trial.trialEndsAt.toISOString(),
          }
        : null,
    };
  }

  private async fulfillZeroAmount(
    user: User,
    quote: Awaited<ReturnType<PaymentsService['buildQuote']>>,
    startMode: PaymentOrder['startMode'],
  ) {
    const receipt = this.makeReceipt();
    const order = await this.orders.save(
      this.orders.create({
        userId: user.id,
        razorpayOrderId: `zero_${receipt}`,
        razorpayPaymentId: null,
        amountPaise: 0,
        currency: 'INR',
        receipt,
        planMonths: quote.plan.months,
        couponCode: quote.couponCode,
        startMode,
        listPricePaise: quote.listPricePaise,
        discountPaise: quote.discountPaise,
        status: 'paid',
      }),
    );
    return this.activateMembership(user, order);
  }

  private async activateMembership(user: User, order: PaymentOrder) {
    if (order.planMonths == null) {
      throw new BadRequestException('This order is not a membership purchase.');
    }

    await this.expireEnded(user.id);
    await this.assertCanPurchase(user.id);

    const plan =
      (await this.membershipPlans.findByMonths(order.planMonths)) ??
      ({
        months: order.planMonths,
        name: `${order.planMonths}-Month Membership`,
      } satisfies Pick<MembershipPlan, 'months' | 'name'>);

    const { startsAt, endsAt, status } = await this.resolveTerm(
      user.id,
      order.startMode,
      plan.months,
    );

    return this.memberships.save(
      this.memberships.create({
        userId: user.id,
        planMonths: plan.months,
        planName: plan.name,
        listPricePaise: order.listPricePaise,
        discountPaise: order.discountPaise,
        amountPaidPaise: order.amountPaise,
        status,
        startsAt,
        endsAt,
        paymentOrderId: order.id,
        razorpayPaymentId: order.razorpayPaymentId,
      }),
    );
  }

  private async resolveTerm(
    userId: string,
    startMode: PaymentOrder['startMode'],
    months: number,
  ) {
    const now = new Date();
    const active = await this.findActive(userId);
    const trial = await this.trials.findOne({ where: { userId } });
    const trialStillRunning =
      trial && now <= trial.trialEndsAt ? trial : null;

    if (active) {
      const startsAt = active.endsAt;
      return {
        status: 'scheduled' as const,
        startsAt,
        endsAt: this.addMonths(startsAt, months),
      };
    }

    if (startMode === 'after_current' && trialStillRunning) {
      const startsAt = trialStillRunning.trialEndsAt;
      return {
        status: 'scheduled' as const,
        startsAt,
        endsAt: this.addMonths(startsAt, months),
      };
    }

    return {
      status: 'active' as const,
      startsAt: now,
      endsAt: this.addMonths(now, months),
    };
  }

  private async assertCanPurchase(userId: string) {
    await this.expireEnded(userId);
    const scheduled = await this.memberships.findOne({
      where: { userId, status: 'scheduled' },
    });
    if (scheduled) {
      throw new BadRequestException(
        'You already have a scheduled next membership.',
      );
    }
  }

  private async findActive(userId: string) {
    const now = new Date();
    const membership = await this.memberships.findOne({
      where: { userId, status: 'active' },
      order: { endsAt: 'DESC' },
    });
    if (!membership || membership.endsAt < now) return null;
    return membership;
  }

  private async expireEnded(userId: string) {
    const now = new Date();
    const active = await this.memberships.find({
      where: { userId, status: 'active' },
    });
    const expired = active.filter((row) => row.endsAt < now);
    for (const row of expired) {
      row.status = 'expired';
    }
    if (expired.length) await this.memberships.save(expired);

    const due = await this.memberships.find({
      where: { userId, status: 'scheduled' },
    });
    const starting = due.filter((row) => row.startsAt <= now);
    for (const row of starting) {
      row.status = 'active';
    }
    if (starting.length) await this.memberships.save(starting);
  }

  private async buildQuote(
    user: User,
    planMonths: number,
    couponCode?: string,
  ) {
    const plan = await this.membershipPlans.requireActiveByMonths(planMonths);
    const offer = await this.membershipOffers.findCurrentOffer();
    const offerPrice = offer
      ? this.membershipOffers.priceForMonths(offer, planMonths)
      : null;

    const originalPricePaise = plan.listPricePaise;
    const listPricePaise = offerPrice?.offerPricePaise ?? plan.listPricePaise;
    let discountPaise = 0;
    let appliedCoupon: string | null = null;
    let discountLabel = '—';

    const trimmed = couponCode?.trim();
    if (trimmed) {
      const coupon = await this.coupons.findByCode(trimmed);
      if (!coupon) {
        throw new BadRequestException('This coupon code is not valid.');
      }
      if (
        coupon.assignedUserId &&
        coupon.assignedUserId !== user.id
      ) {
        throw new BadRequestException(
          'This coupon is assigned to another member.',
        );
      }
      appliedCoupon = coupon.code;
      discountPaise =
        coupon.discountType === 'percent'
          ? Math.floor((listPricePaise * coupon.discountValue) / 100)
          : coupon.discountValue * 100;
      discountLabel = coupon.discountLabel || `${coupon.discountValue} off`;
    } else if (user.referredByUserId) {
      discountPaise = Math.floor(
        (listPricePaise * REFERRAL_DISCOUNT_PERCENT) / 100,
      );
      discountLabel = `${REFERRAL_DISCOUNT_PERCENT}% referral`;
    }

    if (discountPaise > listPricePaise) discountPaise = listPricePaise;
    const amountPaise = listPricePaise - discountPaise;

    return {
      plan,
      originalPricePaise,
      listPricePaise,
      discountPaise,
      amountPaise,
      couponCode: appliedCoupon,
      discountLabel,
      offer: offerPrice
        ? {
            title: offer!.title,
            badge: offer!.badge || offer!.title,
          }
        : null,
    };
  }

  private toQuoteResponse(quote: Awaited<ReturnType<PaymentsService['buildQuote']>>) {
    return {
      planMonths: quote.plan.months,
      planName: quote.plan.name,
      originalPricePaise: quote.originalPricePaise,
      listPricePaise: quote.listPricePaise,
      discountPaise: quote.discountPaise,
      amountPaise: quote.amountPaise,
      discountLabel: quote.discountLabel,
      couponCode: quote.couponCode,
      offer: quote.offer,
      currency: 'INR' as const,
    };
  }

  private toPublicMembership(membership: Membership) {
    return {
      id: membership.id,
      planName: membership.planName,
      planMonths: membership.planMonths,
      status: membership.status,
      startsAt: membership.startsAt.toISOString(),
      endsAt: membership.endsAt.toISOString(),
      listPricePaise: membership.listPricePaise,
      discountPaise: membership.discountPaise,
      amountPaidPaise: membership.amountPaidPaise,
      razorpayPaymentId: membership.razorpayPaymentId,
      paidAt: membership.createdAt.toISOString(),
    };
  }

  private async createRazorpayOrder(input: {
    amountPaise: number;
    currency: string;
    receipt?: string;
    notes: Record<string, string>;
  }) {
    const client = this.requireClient();
    try {
      return await client.orders.create({
        amount: input.amountPaise,
        currency: input.currency.toUpperCase(),
        receipt: input.receipt?.slice(0, 40) || this.makeReceipt(),
        notes: input.notes,
      });
    } catch (error) {
      const status = this.razorpayStatus(error);
      const detail = this.razorpayMessage(error);
      if (status === 401) {
        throw new ServiceUnavailableException(
          'Razorpay rejected the API keys. Copy Key ID and Key Secret from Razorpay Dashboard → Account & Settings → API Keys (Test mode), put them in backend/.env as RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart the API.',
        );
      }
      throw new InternalServerErrorException(
        detail || 'Unable to create Razorpay order.',
      );
    }
  }

  private signaturesMatch(
    orderId: string,
    paymentId: string,
    received: string,
  ) {
    const secret = this.keySecret();
    if (!secret) {
      throw new ServiceUnavailableException('Razorpay is not configured.');
    }
    const expected = createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const left = Buffer.from(expected);
    const right = Buffer.from(received);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }

  private requireClient() {
    if (!this.razorpay) {
      throw new ServiceUnavailableException(
        'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      );
    }
    return this.razorpay;
  }

  private requireKeyId() {
    const keyId = this.keyId();
    if (!keyId) {
      throw new ServiceUnavailableException('Razorpay is not configured.');
    }
    return keyId;
  }

  private keyId() {
    return this.config.get<string>('RAZORPAY_KEY_ID')?.trim() || '';
  }

  private keySecret() {
    return this.config.get<string>('RAZORPAY_KEY_SECRET')?.trim() || '';
  }

  private makeReceipt() {
    return `thm_${Date.now().toString(36)}`.slice(0, 40);
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date.getTime());
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private razorpayStatus(error: unknown) {
    if (
      typeof error === 'object' &&
      error &&
      'statusCode' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number'
    ) {
      return (error as { statusCode: number }).statusCode;
    }
    return null;
  }

  private razorpayMessage(error: unknown) {
    if (
      typeof error === 'object' &&
      error &&
      'error' in error &&
      typeof (error as { error?: { description?: string } }).error
        ?.description === 'string'
    ) {
      return (error as { error: { description: string } }).error.description;
    }
    if (error instanceof Error) return error.message;
    return null;
  }
}
