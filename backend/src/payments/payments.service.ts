import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { Repository } from 'typeorm';
import { CouponsService } from '../coupons/coupons.service';
import { detectVisitorRegion } from '../common/visitor-region';
import { sendResendEmail } from '../mail/resend';
import { SettingsService } from '../settings/settings.service';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { TrialStatus } from '../users/enums/trial-status.enum';
import { Region } from '../users/enums/region.enum';
import { User } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { QuoteMembershipDto } from './dto/quote-membership.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { buildMembershipInvoicePdf } from './invoice-pdf';
import { InvoicesService } from './invoices.service';
import { Membership } from './membership.entity';
import { MembershipPlan } from './membership-plan.entity';
import { DEFAULT_REFERRAL_DISCOUNT_PERCENT } from './membership-plans';
import { MembershipOffersService } from './membership-offers.service';
import { MembershipPlansService } from './membership-plans.service';
import { PaymentOrder } from './payment-order.entity';

const MIN_ORDER_PAISE = 100;
/** Minimum payable after coupon/referral: ₹1 / $1 (100 paise or cents). */
const MIN_PAYABLE_MINOR = 100;

type RazorpayInvoiceRecord = {
  id: string;
  order_id?: string | null;
  short_url?: string | null;
  status?: string;
  amount?: number;
  currency?: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly razorpay: Razorpay | null;

  constructor(
    private readonly config: ConfigService,
    private readonly coupons: CouponsService,
    private readonly membershipPlans: MembershipPlansService,
    private readonly membershipOffers: MembershipOffersService,
    private readonly settings: SettingsService,
    private readonly invoices: InvoicesService,
    @InjectRepository(PaymentOrder)
    private readonly orders: Repository<PaymentOrder>,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
    @InjectRepository(TrialRegistration)
    private readonly trials: Repository<TrialRegistration>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    const keyId = this.keyId();
    const keySecret = this.keySecret();
    this.razorpay =
      keyId && keySecret
        ? new Razorpay({ key_id: keyId, key_secret: keySecret })
        : null;
  }

  async listPlans(
    headers: Record<string, string | string[] | undefined> = {},
    regionOverride: Region | null = null,
  ) {
    const region =
      regionOverride ??
      (
        await detectVisitorRegion(headers, {
          forceRegion: this.config.get<string>('FORCE_REGION'),
          defaultRegion: this.config.get<string>('DEFAULT_REGION'),
        })
      ).region;
    return this.membershipPlans.listPublic(region);
  }

  async quote(user: User, dto: QuoteMembershipDto) {
    const quote = await this.buildQuote(
      user,
      dto.planMonths,
      dto.couponCode,
      dto.applyReferralDiscount === true,
      dto.domainVerificationId,
    );
    return this.toQuoteResponse(quote);
  }

  async createOrder(user: User, dto: CreateOrderDto) {
    const startMode = dto.startMode ?? 'now';
    const startsOn = this.normalizeStartsOn(dto.startsOn);
    await this.assertCanPurchase(user.id);

    if (dto.planMonths != null) {
      const quote = await this.buildQuote(
        user,
        dto.planMonths,
        dto.couponCode,
        dto.applyReferralDiscount === true,
        dto.domainVerificationId,
      );
      // Client must confirm the discounted payable (UI amount) before we open
      // the gateway — prevents charging list price after a coupon was shown.
      if (dto.expectedAmountPaise == null) {
        throw new BadRequestException(
          'Confirm the payable amount from the quote before starting payment.',
        );
      }
      if (dto.expectedAmountPaise !== quote.amountPaise) {
        throw new BadRequestException(
          'The membership price was updated. Please review the new amount and try again.',
        );
      }
      if (quote.amountPaise === 0) {
        const membership = await this.fulfillZeroAmount(
          user,
          quote,
          startMode,
          startsOn,
        );
        return {
          skipCheckout: true as const,
          order_id: null,
          amount: 0,
          currency: quote.currency,
          key_id: this.requireKeyId(),
          membership: this.toPublicMembership(membership),
        };
      }

      const receipt = (dto.receipt?.slice(0, 40) || this.makeReceipt()).slice(
        0,
        40,
      );
      const notes: Record<string, string> = {
        userId: user.id,
        planMonths: String(quote.plan.months),
        planName: quote.plan.name,
        ...(quote.couponCode ? { couponCode: quote.couponCode } : {}),
      };

      // Always use Orders API + Checkout for membership.
      // Razorpay Invoices often block international cards even when the merchant
      // account has International Payments enabled (error: "International cards
      // are not supported"). Orders inherit the account's card settings.
      //
      // Payable amount is always quote.amountPaise (after coupon/referral + ₹1/$1 floor).
      // Never charge list/original price here.
      const order = await this.createRazorpayOrder({
        amountPaise: quote.amountPaise,
        currency: quote.currency,
        receipt,
        notes,
      });

      const gatewayAmount = Number(order.amount);
      if (
        !Number.isFinite(gatewayAmount) ||
        gatewayAmount !== quote.amountPaise
      ) {
        throw new InternalServerErrorException(
          'Payment gateway amount did not match the discounted payable amount.',
        );
      }

      await this.orders.save(
        this.orders.create({
          userId: user.id,
          razorpayOrderId: order.id,
          razorpayInvoiceId: null,
          razorpayInvoiceUrl: null,
          amountPaise: quote.amountPaise,
          currency: quote.currency,
          receipt,
          planMonths: quote.plan.months,
          couponCode: quote.couponCode,
          verifiedEmail: quote.verifiedEmail,
          domainVerificationId: quote.domainVerificationId,
          startMode,
          startsOn,
          listPricePaise: quote.listPricePaise,
          discountPaise: quote.discountPaise,
          status: 'created',
        }),
      );

      return {
        skipCheckout: false as const,
        order_id: order.id,
        amount: quote.amountPaise,
        currency: quote.currency,
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
        startsOn,
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

    // Always sign with the order id from our DB (not a client-only value).
    const signatureOk = this.signaturesMatch(
      order.razorpayOrderId,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );
    const paymentOk = signatureOk
      ? true
      : await this.razorpayPaymentMatchesOrder(
          order.razorpayOrderId,
          dto.razorpay_payment_id,
          order.amountPaise,
        );

    if (!paymentOk) {
      throw new BadRequestException('Payment signature mismatch.');
    }

    const membership = await this.fulfillPaidOrder(
      order,
      dto.razorpay_payment_id,
    );

    return {
      success: true,
      membership: membership ? this.toPublicMembership(membership) : null,
    };
  }

  /**
   * Razorpay webhook: activates membership without relying on the browser.
   * Always ack with 200 after a valid signature so Razorpay does not retry forever.
   */
  async handleRazorpayWebhook(input: {
    rawBody?: Buffer;
    signature?: string;
    payload: Record<string, unknown>;
  }) {
    const secret = this.webhookSecret();
    if (!secret) {
      this.logger.warn(
        'RAZORPAY_WEBHOOK_SECRET is not set — ignoring webhook.',
      );
      throw new ServiceUnavailableException(
        'Razorpay webhook is not configured.',
      );
    }

    const raw =
      input.rawBody?.toString('utf8') ||
      JSON.stringify(input.payload ?? {});
    if (!this.webhookSignaturesMatch(raw, input.signature || '')) {
      throw new BadRequestException('Invalid webhook signature.');
    }

    const event = String(input.payload?.event || '');
    const paymentHints = this.extractWebhookPaymentHints(input.payload);

    if (!paymentHints.orderId && !paymentHints.paymentId) {
      this.logger.debug(`Ignoring Razorpay event without order/payment: ${event}`);
      return { received: true, handled: false };
    }

    try {
      if (paymentHints.orderId) {
        const order = await this.orders.findOne({
          where: { razorpayOrderId: paymentHints.orderId },
        });
        if (!order) {
          this.logger.warn(
            `Webhook ${event}: no local order for ${paymentHints.orderId}`,
          );
          return { received: true, handled: false };
        }

        let paymentId = paymentHints.paymentId;
        if (!paymentId) {
          paymentId = await this.findCapturedPaymentIdForOrder(
            order.razorpayOrderId,
            order.amountPaise,
          );
        }
        if (!paymentId) {
          this.logger.warn(
            `Webhook ${event}: order ${order.razorpayOrderId} has no captured payment yet`,
          );
          return { received: true, handled: false };
        }

        const matches = await this.razorpayPaymentMatchesOrder(
          order.razorpayOrderId,
          paymentId,
          order.amountPaise,
        );
        if (!matches && order.status !== 'paid') {
          this.logger.warn(
            `Webhook ${event}: payment ${paymentId} did not match order ${order.razorpayOrderId}`,
          );
          return { received: true, handled: false };
        }

        await this.fulfillPaidOrder(order, paymentId);
        return { received: true, handled: true };
      }

      // payment.captured without order_id in payload — look up payment then order
      if (paymentHints.paymentId) {
        const payment = await this.fetchRazorpayPayment(paymentHints.paymentId);
        const orderId = String(payment.order_id || '');
        if (!orderId) {
          return { received: true, handled: false };
        }
        const order = await this.orders.findOne({
          where: { razorpayOrderId: orderId },
        });
        if (!order) {
          return { received: true, handled: false };
        }
        await this.fulfillPaidOrder(order, paymentHints.paymentId);
        return { received: true, handled: true };
      }
    } catch (err) {
      this.logger.error(
        `Webhook ${event} fulfill failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      // Still 200 so Razorpay does not hammer retries for permanent errors;
      // reconcile on next membership/me will retry via API poll.
    }

    return { received: true, handled: false };
  }

  async getMyAccess(user: User) {
    // Recover memberships when the browser never called /verify-payment.
    await this.reconcileOpenOrdersForUser(user.id);
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

    // Keep trial usable until a future paid membership begins (covers older purchases too).
    if (scheduled) {
      await this.extendTrialUntilMembership(user.id, scheduled.startsAt);
    }

    const trial = await this.trials.findOne({ where: { userId: user.id } });
    if (trial && trial.status !== TrialStatus.Completed) {
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
      } else if (trial.status !== TrialStatus.Scheduled) {
        trial.status = TrialStatus.Scheduled;
        await this.trials.save(trial);
      }
    }

    const trialActive =
      trial &&
      trial.status !== TrialStatus.Completed &&
      trial.status !== TrialStatus.Expired &&
      now >= trial.trialStartsAt &&
      now <= trial.trialEndsAt
        ? trial
        : null;
    const trialScheduled =
      trial &&
      trial.status !== TrialStatus.Completed &&
      trial.status !== TrialStatus.Expired &&
      now < trial.trialStartsAt
        ? trial
        : null;

    const lastExpiredDefault =
      rows.find((row) => row.status === 'expired') ?? null;
    // After an admin upgrade, prefer the superseded original membership so its
    // invoice remains available on My Membership alongside the upgrade invoice.
    const lastExpired = (() => {
      if (!current) return lastExpiredDefault;
      const isUpgrade =
        current.paymentOrderId.startsWith('admin-upgrade-') ||
        current.planName.toLowerCase().includes('membership upgrade');
      if (!isUpgrade) return lastExpiredDefault;
      const currentStart = this.startOfLocalDay(current.startsAt).getTime();
      const superseded =
        rows.find((row) => {
          if (row.status !== 'expired' || row.id === current.id) return false;
          if (row.planMonths >= current.planMonths) return false;
          return (
            this.startOfLocalDay(row.startsAt).getTime() === currentStart
          );
        }) ?? null;
      return superseded ?? lastExpiredDefault;
    })();

    let state: 'trial' | 'active' | 'expired' | 'scheduled' | 'pending' =
      'pending';
    if (current) state = 'active';
    else if (trialActive) state = 'trial';
    else if (trialScheduled) state = 'scheduled';
    else if (lastExpired) state = 'expired';

    const invoiceMembershipIds = [current, scheduled, lastExpired]
      .filter((row): row is Membership => Boolean(row))
      .map((row) => row.id);
    const invoices =
      await this.invoices.findByMembershipIds(invoiceMembershipIds);
    const invoiceByMembershipId = new Map(
      invoices
        .filter((row) => row.membershipId)
        .map((row) => [row.membershipId as string, row]),
    );

    return {
      state,
      current: current
        ? this.toPublicMembership(
            current,
            invoiceByMembershipId.get(current.id) ?? null,
          )
        : null,
      scheduled: scheduled
        ? this.toPublicMembership(
            scheduled,
            invoiceByMembershipId.get(scheduled.id) ?? null,
          )
        : null,
      lastExpired: lastExpired
        ? this.toPublicMembership(
            lastExpired,
            invoiceByMembershipId.get(lastExpired.id) ?? null,
          )
        : null,
      trial: trial
        ? {
            status: trial.status,
            startsAt: trial.trialStartsAt.toISOString(),
            endsAt: trial.trialEndsAt.toISOString(),
          }
        : null,
    };
  }

  async getInvoice(user: User, membershipId: string) {
    const membership = await this.memberships.findOne({
      where: { id: membershipId, userId: user.id },
    });
    if (!membership) {
      throw new NotFoundException('Membership invoice not found.');
    }

    if (membership.amountPaidPaise <= 0) {
      throw new BadRequestException(
        'No invoice is generated for zero-payment or complimentary memberships.',
      );
    }

    const order =
      membership.paymentOrderId.startsWith('admin-manual-') ||
      membership.paymentOrderId.startsWith('admin-upgrade-')
        ? null
        : await this.orders.findOne({
            where: { id: membership.paymentOrderId, userId: user.id },
          });

    const paymentRef =
      membership.razorpayPaymentId?.trim() ||
      order?.razorpayPaymentId?.trim() ||
      null;
    const adminManual =
      membership.paymentOrderId.startsWith('admin-manual-') ||
      membership.paymentOrderId.startsWith('admin-upgrade-');
    const paymentMethod =
      membership.paymentMethod?.trim() ||
      (adminManual
        ? membership.paymentOrderId.startsWith('admin-upgrade-')
          ? 'Membership Upgrade'
          : 'Admin assigned'
        : 'Online (Razorpay)');

    const invoice = await this.invoices.ensureMembershipInvoice({
      membership,
      user,
      paymentMethod,
      paymentReference: paymentRef,
      discountLabel:
        order?.couponCode?.trim() ||
        (membership.paymentOrderId.startsWith('admin-upgrade-')
          ? 'Membership Upgrade'
          : null),
    });
    if (!invoice) {
      throw new BadRequestException(
        'No invoice is generated for zero-payment or complimentary memberships.',
      );
    }

    const currency =
      membership.currency?.toUpperCase() === 'USD' ? ('USD' as const) : ('INR' as const);
    // Billing location label follows account region (signup), not device location.
    const isInternational = user.region === Region.OutsideIndia;

    const location = user.state?.trim() || null;
    const memberLocation = isInternational
      ? location
      : location
        ? `${location}, India`
        : 'India';

    const pdf = await buildMembershipInvoicePdf({
      invoiceNo: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      paidAt: membership.createdAt,
      memberName: user.fullName,
      memberEmail: user.email,
      memberMobile: user.mobile,
      memberLocation,
      isInternational,
      planName: membership.planName,
      planMonths: membership.planMonths,
      listPricePaise: membership.listPricePaise,
      discountPaise: membership.discountPaise,
      discountLabel: invoice.discountLabel,
      amountPaidPaise: membership.amountPaidPaise,
      currency,
      paymentRef: invoice.paymentReference,
      paymentMethod: invoice.paymentMethod || paymentMethod,
      startsAt: membership.startsAt,
      endsAt: membership.endsAt,
    });

    return {
      type: 'pdf' as const,
      filename: `the-healing-mat-invoice-${invoice.invoiceNumber}.pdf`,
      pdf,
    };
  }

  private async fulfillZeroAmount(
    user: User,
    quote: Awaited<ReturnType<PaymentsService['buildQuote']>>,
    startMode: PaymentOrder['startMode'],
    startsOn: string | null,
  ) {
    const receipt = this.makeReceipt();
    const order = await this.orders.save(
      this.orders.create({
        userId: user.id,
        razorpayOrderId: `zero_${receipt}`,
        razorpayPaymentId: null,
        amountPaise: 0,
        currency: quote.currency,
        receipt,
        planMonths: quote.plan.months,
        couponCode: quote.couponCode,
        verifiedEmail: quote.verifiedEmail,
        domainVerificationId: quote.domainVerificationId,
        startMode,
        startsOn,
        listPricePaise: quote.listPricePaise,
        discountPaise: quote.discountPaise,
        status: 'paid',
      }),
    );
    return this.activateMembership(user, order);
  }

  /**
   * Mark order paid and activate membership. Idempotent for verify + webhook races.
   * Skips the "already scheduled" purchase guard — payment is already confirmed.
   */
  private async fulfillPaidOrder(order: PaymentOrder, paymentId: string) {
    if (order.status !== 'paid') {
      order.status = 'paid';
      order.razorpayPaymentId = paymentId;
      await this.orders.save(order);
    } else if (!order.razorpayPaymentId && paymentId) {
      order.razorpayPaymentId = paymentId;
      await this.orders.save(order);
    }

    const existing = await this.memberships.findOne({
      where: { paymentOrderId: order.id },
    });
    if (existing) return existing;

    if (order.planMonths == null) return null;

    const user = await this.users.findOne({ where: { id: order.userId } });
    if (!user) {
      this.logger.error(
        `Cannot fulfill order ${order.id}: user ${order.userId} not found`,
      );
      return null;
    }

    return this.activateMembership(user, order, { skipPurchaseCheck: true });
  }

  /**
   * Poll Razorpay for open local orders and activate if payment already captured.
   * Covers the case where checkout succeeded but /verify-payment never ran and
   * the webhook was missed or not configured yet.
   */
  private async reconcileOpenOrdersForUser(userId: string) {
    const open = await this.orders.find({
      where: { userId, status: 'created' },
      order: { createdAt: 'DESC' },
      take: 8,
    });

    for (const order of open) {
      try {
        const paymentId = await this.findCapturedPaymentIdForOrder(
          order.razorpayOrderId,
          order.amountPaise,
        );
        if (!paymentId) continue;
        await this.fulfillPaidOrder(order, paymentId);
      } catch (err) {
        this.logger.warn(
          `Reconcile failed for order ${order.razorpayOrderId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // Paid in DB but membership insert never finished (crash between saves).
    const paid = await this.orders.find({
      where: { userId, status: 'paid' },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    for (const order of paid) {
      if (order.planMonths == null) continue;
      const existing = await this.memberships.findOne({
        where: { paymentOrderId: order.id },
      });
      if (existing) continue;
      try {
        const paymentId =
          order.razorpayPaymentId ||
          (await this.findCapturedPaymentIdForOrder(
            order.razorpayOrderId,
            order.amountPaise,
          ));
        if (!paymentId) continue;
        await this.fulfillPaidOrder(order, paymentId);
      } catch (err) {
        this.logger.warn(
          `Reconcile paid-order failed for ${order.razorpayOrderId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  private async activateMembership(
    user: User,
    order: PaymentOrder,
    options?: { skipPurchaseCheck?: boolean },
  ) {
    if (order.planMonths == null) {
      throw new BadRequestException('This order is not a membership purchase.');
    }

    await this.expireEnded(user.id);
    if (!options?.skipPurchaseCheck) {
      await this.assertCanPurchase(user.id);
    }

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
      order.startsOn,
    );

    const membership = await this.memberships.save(
      this.memberships.create({
        userId: user.id,
        planMonths: plan.months,
        planName: plan.name,
        listPricePaise: order.listPricePaise,
        discountPaise: order.discountPaise,
        amountPaidPaise: order.amountPaise,
        currency: order.currency || 'INR',
        paymentMethod: 'Online (Razorpay)',
        status,
        startsAt,
        endsAt,
        paymentOrderId: order.id,
        razorpayPaymentId: order.razorpayPaymentId,
        razorpayInvoiceId: order.razorpayInvoiceId,
        razorpayInvoiceUrl: order.razorpayInvoiceUrl,
      }),
    );

    if (status === 'active') {
      // Paid access begins now — close any prior active term and end the trial.
      await this.supersedeOtherActiveMemberships(user.id, membership.id);
      await this.completeTrialForMembership(user.id);
    } else if (status === 'scheduled') {
      // Keep trial access until the paid membership start date.
      await this.extendTrialUntilMembership(user.id, startsAt);
    }

    await this.coupons
      .recordRedemption({
        code: order.couponCode,
        userId: user.id,
        paymentOrderId: order.id,
        verifiedEmail: order.verifiedEmail,
      })
      .catch(() => null);

    if (order.domainVerificationId) {
      await this.coupons
        .markDomainVerificationUsed(order.domainVerificationId)
        .catch(() => null);
    }

    await this.invoices
      .ensureMembershipInvoice({
        membership,
        user,
        paymentMethod: 'Online (Razorpay)',
        paymentReference: order.razorpayPaymentId,
        discountLabel: order.couponCode?.trim() || null,
      })
      .catch((err) => {
        this.logger.warn(
          `Invoice issue failed for membership ${membership.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });

    await this.deliverRazorpayInvoice(user, membership).catch((err) => {
      this.logger.warn(
        `Razorpay invoice delivery failed for membership ${membership.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });

    return membership;
  }

  /**
   * After payment: refresh Razorpay invoice URL, ask Razorpay to email it,
   * and also email the member a link (Resend). No webhook required.
   */
  private async deliverRazorpayInvoice(user: User, membership: Membership) {
    let invoiceId = membership.razorpayInvoiceId?.trim() || null;
    let invoiceUrl = membership.razorpayInvoiceUrl?.trim() || null;

    if (!invoiceId) {
      const order = await this.orders.findOne({
        where: { id: membership.paymentOrderId },
      });
      invoiceId = order?.razorpayInvoiceId?.trim() || null;
      invoiceUrl = order?.razorpayInvoiceUrl?.trim() || invoiceUrl;
    }

    if (!invoiceId) return;

    try {
      const invoice = await this.fetchRazorpayInvoice(invoiceId);
      if (invoice.short_url) {
        invoiceUrl = String(invoice.short_url);
      }
    } catch (err) {
      this.logger.warn(
        `Could not fetch Razorpay invoice ${invoiceId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    if (invoiceUrl && membership.razorpayInvoiceUrl !== invoiceUrl) {
      membership.razorpayInvoiceId = invoiceId;
      membership.razorpayInvoiceUrl = invoiceUrl;
      await this.memberships.save(membership);
    }

    if (user.email?.trim()) {
      try {
        await this.notifyRazorpayInvoiceByEmail(invoiceId);
      } catch (err) {
        this.logger.warn(
          `Razorpay notifyBy email failed for ${invoiceId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      if (invoiceUrl) {
        await this.emailRazorpayInvoiceLink(user, membership, invoiceUrl).catch(
          (err) => {
            this.logger.warn(
              `Resend invoice link failed for ${membership.id}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          },
        );
      }
    }
  }

  private async notifyRazorpayInvoiceByEmail(invoiceId: string) {
    const client = this.requireClient();
    const invoices = client.invoices as {
      notifyBy?: (id: string, medium: string) => Promise<unknown>;
    };
    if (typeof invoices.notifyBy !== 'function') {
      throw new Error('Razorpay invoices.notifyBy is unavailable.');
    }
    await invoices.notifyBy(invoiceId, 'email');
  }

  private async emailRazorpayInvoiceLink(
    user: User,
    membership: Membership,
    invoiceUrl: string,
  ) {
    const email = user.email?.trim();
    if (!email) return;

    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from =
      this.config.get<string>('RESEND_FROM_EMAIL')?.trim() ||
      'The Healing Mat <onboarding@resend.dev>';
    if (!apiKey) return;

    const amount =
      membership.currency?.toUpperCase() === 'USD'
        ? `$${(membership.amountPaidPaise / 100).toFixed(2)}`
        : `₹${Math.round(membership.amountPaidPaise / 100).toLocaleString('en-IN')}`;

    await sendResendEmail({
      apiKey,
      from,
      to: email,
      subject: `Your Healing Mat invoice — ${membership.planName}`,
      text: [
        `Hi ${user.fullName.trim() || 'there'},`,
        '',
        'Thank you for your payment. Your Razorpay invoice is ready:',
        invoiceUrl,
        '',
        `Plan: ${membership.planName}`,
        `Amount paid: ${amount}`,
        '',
        '— The Healing Mat',
      ].join('\n'),
      html: `
        <p>Hi ${this.escapeHtml(user.fullName.trim() || 'there')},</p>
        <p>Thank you for your payment. Your <strong>Razorpay invoice</strong> is ready.</p>
        <p>
          <strong>Plan:</strong> ${this.escapeHtml(membership.planName)}<br />
          <strong>Amount paid:</strong> ${this.escapeHtml(amount)}
        </p>
        <p><a href="${this.escapeHtml(invoiceUrl)}">View / download Razorpay invoice</a></p>
        <p>— The Healing Mat</p>
      `,
    });
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private async resolveTerm(
    userId: string,
    startMode: PaymentOrder['startMode'],
    months: number,
    startsOn?: string | null,
  ) {
    const now = new Date();
    const active = await this.findActive(userId);
    const trial = await this.trials.findOne({ where: { userId } });
    const trialStillRunning =
      trial &&
      trial.status !== TrialStatus.Completed &&
      trial.status !== TrialStatus.Expired &&
      now <= trial.trialEndsAt
        ? trial
        : null;
    const chosenStart = this.parseStartsOn(startsOn);

    // Renew while a paid membership is still active → schedule after it
    // (or activate immediately if the handoff date is already due).
    if (active) {
      const earliest = this.dayAfter(active.endsAt);
      const startsAt = this.laterDate(earliest, chosenStart);
      if (startsAt.getTime() <= now.getTime()) {
        return {
          status: 'active' as const,
          startsAt: now,
          endsAt: this.membershipEndsAt(now, months),
        };
      }
      return {
        status: 'scheduled' as const,
        startsAt,
        endsAt: this.membershipEndsAt(startsAt, months),
      };
    }

    // Explicit "after trial" purchases cannot start before the trial ends.
    if (startMode === 'after_current' && trialStillRunning) {
      const startsAt = this.laterDate(
        trialStillRunning.trialEndsAt,
        chosenStart,
      );
      if (startsAt.getTime() <= now.getTime()) {
        return {
          status: 'active' as const,
          startsAt: now,
          endsAt: this.membershipEndsAt(now, months),
        };
      }
      return {
        status: 'scheduled' as const,
        startsAt,
        endsAt: this.membershipEndsAt(startsAt, months),
      };
    }

    // Trial / pending: today (or no date) starts membership now and ends trial.
    // A future calendar date keeps the trial until that day.
    if (chosenStart && !this.isOnOrBeforeCalendarDay(chosenStart, now)) {
      return {
        status: 'scheduled' as const,
        startsAt: this.startOfLocalDay(chosenStart),
        endsAt: this.membershipEndsAt(this.startOfLocalDay(chosenStart), months),
      };
    }

    return {
      status: 'active' as const,
      startsAt: now,
      endsAt: this.membershipEndsAt(now, months),
    };
  }

  private normalizeStartsOn(value?: string | null): string | null {
    if (!value?.trim()) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      throw new BadRequestException('startsOn must be YYYY-MM-DD.');
    }
    return value.trim();
  }

  private parseStartsOn(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('startsOn must be a valid date.');
    }
    return date;
  }

  private laterDate(a: Date, b: Date | null) {
    if (!b) return a;
    return b > a ? b : a;
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
    if (starting.length) {
      await this.memberships.save(starting);
      // Handoff from prior term / trial → paid member home.
      for (const row of starting) {
        await this.supersedeOtherActiveMemberships(userId, row.id);
      }
      await this.completeTrialForMembership(userId);
    }
  }

  /** End an in-progress/scheduled trial when paid membership access begins. */
  private async completeTrialForMembership(userId: string) {
    const trial = await this.trials.findOne({ where: { userId } });
    if (!trial) return;
    if (trial.status === TrialStatus.Completed) return;

    const now = new Date();
    if (trial.trialEndsAt > now) {
      trial.trialEndsAt = now;
    }
    trial.status = TrialStatus.Completed;
    await this.trials.save(trial);
  }

  /**
   * When a paid membership is scheduled for a future date during a trial,
   * keep trial access until that start date so Trial Home continues.
   */
  private async extendTrialUntilMembership(
    userId: string,
    membershipStartsAt: Date,
  ) {
    const trial = await this.trials.findOne({ where: { userId } });
    if (!trial) return;
    // Completed means paid access already began — do not revive.
    if (trial.status === TrialStatus.Completed) return;

    const keepUntil = new Date(membershipStartsAt.getTime() - 1);
    if (trial.trialEndsAt.getTime() >= keepUntil.getTime()) {
      // Still long enough; ensure status is not stuck on expired.
      if (
        trial.status === TrialStatus.Expired &&
        keepUntil.getTime() >= Date.now()
      ) {
        const now = new Date();
        trial.status =
          now >= trial.trialStartsAt
            ? TrialStatus.Active
            : TrialStatus.Scheduled;
        await this.trials.save(trial);
      }
      return;
    }

    trial.trialEndsAt = keepUntil;
    const now = new Date();
    trial.status =
      now >= trial.trialStartsAt ? TrialStatus.Active : TrialStatus.Scheduled;
    await this.trials.save(trial);
  }

  /** Expire other active memberships when a new one becomes current. */
  private async supersedeOtherActiveMemberships(
    userId: string,
    keepMembershipId: string,
  ) {
    const now = new Date();
    const actives = await this.memberships.find({
      where: { userId, status: 'active' },
    });
    const others = actives.filter((row) => row.id !== keepMembershipId);
    for (const row of others) {
      row.status = 'expired';
      if (row.endsAt > now) row.endsAt = now;
    }
    if (others.length) await this.memberships.save(others);
  }

  private async buildQuote(
    user: User,
    planMonths: number,
    couponCode?: string,
    applyReferralDiscount = false,
    domainVerificationId?: string,
  ) {
    const plan = await this.membershipPlans.requireActiveByMonths(planMonths);
    const currency = user.region === Region.OutsideIndia ? ('USD' as const) : ('INR' as const);
    const offer =
      currency === 'INR' ? await this.membershipOffers.findCurrentOffer() : null;
    const offerPrice = offer
      ? this.membershipOffers.priceForMonths(offer, planMonths)
      : null;

    const originalPricePaise =
      currency === 'USD' ? plan.listPriceUsdCents : plan.listPricePaise;
    const listPricePaise =
      currency === 'USD'
        ? plan.listPriceUsdCents
        : (offerPrice?.offerPricePaise ?? plan.listPricePaise);
    let discountPaise = 0;
    let appliedCoupon: string | null = null;
    let discountLabel = '—';
    let verifiedEmail: string | null = null;
    let resolvedDomainVerificationId: string | null = null;
    const referralDiscountPercent =
      await this.settings.getReferralDiscountPercent();
    const referralDiscountAvailable = Boolean(user.referredByUserId);
    let referralDiscountApplied = false;

    const trimmed = couponCode?.trim() || '';
    const wantsCoupon = Boolean(trimmed);
    const wantsReferral = applyReferralDiscount === true;

    if (wantsCoupon && wantsReferral) {
      throw new BadRequestException(
        'You can apply either a coupon or a referral discount, not both.',
      );
    }

    if (wantsCoupon) {
      const coupon = await this.coupons.findByCode(trimmed);
      if (!coupon) {
        throw new BadRequestException('Invalid coupon');
      }

      if (this.coupons.isCorporateCoupon(coupon)) {
        const verificationId = domainVerificationId?.trim();
        if (!verificationId) {
          throw new BadRequestException(
            'Verify your work email to apply this corporate coupon.',
          );
        }
        const verification = await this.coupons.requireValidDomainVerification({
          userId: user.id,
          couponId: coupon.id,
          domainVerificationId: verificationId,
        });
        verifiedEmail = verification.email;
        resolvedDomainVerificationId = verification.id;
      }

      await this.coupons.assertRedeemable(coupon, user.id, {
        verifiedEmail,
      });
      appliedCoupon = coupon.code;
      if (coupon.discountType === 'percent') {
        discountPaise = Math.floor(
          (listPricePaise * coupon.discountValue) / 100,
        );
      } else {
        // Fixed value is major units of the member's checkout currency
        // (₹ for India, $ for outside-India). Same *100 → paise/cents.
        discountPaise = coupon.discountValue * 100;
      }
      discountLabel = coupon.discountLabel || `${coupon.discountValue} off`;

      // Full company-paid corporate seat: allow ₹0 / $0 checkout.
      if (
        coupon.discountType === 'percent' &&
        coupon.discountValue >= 100 &&
        this.coupons.isCorporateCoupon(coupon)
      ) {
        discountPaise = listPricePaise;
      }
    } else if (
      wantsReferral &&
      referralDiscountAvailable &&
      referralDiscountPercent > 0
    ) {
      discountPaise = Math.floor(
        (listPricePaise * referralDiscountPercent) / 100,
      );
      discountLabel = `${referralDiscountPercent}% referral`;
      referralDiscountApplied = true;
    } else if (wantsReferral && !referralDiscountAvailable) {
      throw new BadRequestException(
        'Referral discount is not available on this account.',
      );
    } else if (wantsReferral && referralDiscountPercent <= 0) {
      throw new BadRequestException(
        'Referral discount is currently unavailable.',
      );
    }

    if (discountPaise > listPricePaise) discountPaise = listPricePaise;
    let amountPaise = listPricePaise - discountPaise;
    const fullyCoveredCorporate =
      Boolean(appliedCoupon) &&
      amountPaise === 0 &&
      Boolean(resolvedDomainVerificationId);
    // Coupon/referral may wipe the price; keep at least ₹1 / $1 unless a
    // corporate coupon covers 100% of the seat.
    if (amountPaise < MIN_PAYABLE_MINOR && !fullyCoveredCorporate) {
      amountPaise = MIN_PAYABLE_MINOR;
      discountPaise = Math.max(0, listPricePaise - amountPaise);
    }

    return {
      plan,
      currency,
      originalPricePaise,
      listPricePaise,
      discountPaise,
      amountPaise,
      couponCode: appliedCoupon,
      discountLabel,
      verifiedEmail,
      domainVerificationId: resolvedDomainVerificationId,
      referralDiscountAvailable,
      referralDiscountApplied,
      referralDiscountPercent:
        referralDiscountPercent || DEFAULT_REFERRAL_DISCOUNT_PERCENT,
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
      referralDiscountAvailable: quote.referralDiscountAvailable,
      referralDiscountApplied: quote.referralDiscountApplied,
      referralDiscountPercent: quote.referralDiscountPercent,
      offer: quote.offer,
      currency: quote.currency,
    };
  }

  private toPublicMembership(
    membership: Membership,
    invoice?: { invoiceNumber: string } | null,
  ) {
    const isUpgrade =
      membership.paymentOrderId.startsWith('admin-upgrade-') ||
      membership.planName.toLowerCase().includes('membership upgrade');
    const invoiceDownloadable = membership.amountPaidPaise > 0;
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
      currency: (membership.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD',
      razorpayPaymentId: membership.razorpayPaymentId,
      razorpayInvoiceId: membership.razorpayInvoiceId,
      razorpayInvoiceUrl: membership.razorpayInvoiceUrl,
      paidAt: membership.createdAt.toISOString(),
      /** Healing Mat branded PDF — only for paid memberships (not complimentary). */
      invoiceDownloadable,
      invoiceNumber: invoice?.invoiceNumber ?? null,
      isUpgrade,
    };
  }

  private async razorpayPaymentMatchesOrder(
    orderId: string,
    paymentId: string,
    amountPaise: number,
  ) {
    try {
      const payment = await this.fetchRazorpayPayment(paymentId);
      const status = String(payment.status || '');
      const paidStatuses = new Set(['authorized', 'captured']);
      return (
        payment.order_id === orderId &&
        paidStatuses.has(status) &&
        Number(payment.amount) === amountPaise
      );
    } catch {
      return false;
    }
  }

  private async fetchRazorpayPayment(paymentId: string) {
    const client = this.requireClient();
    return (await client.payments.fetch(paymentId)) as {
      id?: string;
      order_id?: string | null;
      status?: string;
      amount?: number;
      currency?: string;
      invoice_id?: string | null;
    };
  }

  /**
   * Look up a Razorpay payment and any linked invoice (for admin recovery).
   */
  async resolveRazorpayPaymentInvoice(paymentId: string) {
    const cleaned = paymentId.trim();
    if (!cleaned.startsWith('pay_')) {
      return null;
    }

    try {
      const payment = await this.fetchRazorpayPayment(cleaned);
      const invoiceId =
        payment.invoice_id != null ? String(payment.invoice_id).trim() : '';
      let invoiceUrl: string | null = null;
      if (invoiceId) {
        try {
          const invoice = await this.fetchRazorpayInvoice(invoiceId);
          invoiceUrl = invoice.short_url ? String(invoice.short_url) : null;
        } catch {
          invoiceUrl = null;
        }
      }
      return {
        paymentId: String(payment.id || cleaned),
        invoiceId: invoiceId || null,
        invoiceUrl,
        amountPaise:
          payment.amount != null && Number.isFinite(Number(payment.amount))
            ? Number(payment.amount)
            : null,
        currency: payment.currency
          ? String(payment.currency).toUpperCase()
          : null,
      };
    } catch {
      return null;
    }
  }

  private async findCapturedPaymentIdForOrder(
    orderId: string,
    amountPaise: number,
  ): Promise<string | null> {
    try {
      const client = this.requireClient();
      const result = (await client.orders.fetchPayments(orderId)) as {
        items?: Array<{
          id?: string;
          status?: string;
          amount?: number;
        }>;
      };
      const paidStatuses = new Set(['authorized', 'captured']);
      const match = (result.items || []).find(
        (item) =>
          paidStatuses.has(String(item.status || '')) &&
          Number(item.amount) === amountPaise &&
          Boolean(item.id),
      );
      return match?.id ? String(match.id) : null;
    } catch {
      return null;
    }
  }

  private extractWebhookPaymentHints(payload: Record<string, unknown>): {
    orderId: string | null;
    paymentId: string | null;
  } {
    const root =
      payload && typeof payload.payload === 'object' && payload.payload
        ? (payload.payload as Record<string, unknown>)
        : payload;

    const entityOf = (key: string) => {
      const wrap = root?.[key];
      if (!wrap || typeof wrap !== 'object') return null;
      const entity = (wrap as { entity?: Record<string, unknown> }).entity;
      return entity && typeof entity === 'object' ? entity : null;
    };

    const payment = entityOf('payment');
    const order = entityOf('order');
    const invoice = entityOf('invoice');

    const paymentId =
      (payment?.id != null ? String(payment.id) : null) ||
      (invoice?.payment_id != null ? String(invoice.payment_id) : null) ||
      null;

    const orderId =
      (order?.id != null ? String(order.id) : null) ||
      (payment?.order_id != null ? String(payment.order_id) : null) ||
      (invoice?.order_id != null ? String(invoice.order_id) : null) ||
      null;

    return { orderId, paymentId };
  }

  private webhookSignaturesMatch(rawBody: string, received: string) {
    const secret = this.webhookSecret();
    if (!secret || !received) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const left = Buffer.from(expected);
    const right = Buffer.from(received);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }

  private webhookSecret() {
    return this.config.get<string>('RAZORPAY_WEBHOOK_SECRET')?.trim() || '';
  }

  private async createRazorpayInvoice(input: {
    amountPaise: number;
    currency: string;
    receipt?: string;
    planName: string;
    description: string;
    customer: {
      name: string;
      email: string | null;
      contact: string | null;
      region?: Region;
    };
    notes: Record<string, string>;
  }): Promise<RazorpayInvoiceRecord> {
    const client = this.requireClient();
    const name = this.invoiceCustomerName(input.customer.name);
    const customer: Record<string, string> = { name };
    if (input.customer.email?.trim()) {
      customer.email = input.customer.email.trim();
    }
    const contact = this.invoiceCustomerContact(
      input.customer.contact,
      input.customer.region,
    );
    if (contact) customer.contact = contact;

    try {
      let invoice = (await client.invoices.create({
        type: 'invoice',
        description: input.description.slice(0, 2048),
        partial_payment: false,
        // Don't email "pay now" during checkout — invoice updates after payment.
        email_notify: 0,
        sms_notify: 0,
        customer,
        line_items: [
          {
            name: input.planName.slice(0, 255),
            description: input.description.slice(0, 2048),
            amount: input.amountPaise,
            currency: input.currency.toUpperCase(),
            quantity: 1,
          },
        ],
        notes: input.notes,
        receipt: (input.receipt?.slice(0, 40) || this.makeReceipt()).slice(0, 40),
      })) as RazorpayInvoiceRecord;

      // Draft invoices have no order_id until issued.
      if (!invoice.order_id && invoice.id) {
        invoice = (await client.invoices.issue(
          invoice.id,
        )) as RazorpayInvoiceRecord;
      }

      if (!invoice.order_id) {
        throw new InternalServerErrorException(
          'Razorpay invoice did not return an order id.',
        );
      }

      return {
        ...invoice,
        id: String(invoice.id),
        order_id: String(invoice.order_id),
        short_url: invoice.short_url ? String(invoice.short_url) : null,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const status = this.razorpayStatus(error);
      const detail = this.razorpayMessage(error);
      if (status === 401) {
        throw new ServiceUnavailableException(
          'Razorpay rejected the API keys. Copy Key ID and Key Secret from Razorpay Dashboard → Account & Settings → API Keys (Test mode), put them in backend/.env as RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart the API.',
        );
      }
      throw new InternalServerErrorException(
        detail || 'Unable to create Razorpay invoice.',
      );
    }
  }

  private async fetchRazorpayInvoice(invoiceId: string) {
    const client = this.requireClient();
    return (await client.invoices.fetch(
      invoiceId,
    )) as RazorpayInvoiceRecord;
  }

  private invoiceCustomerName(fullName: string) {
    const cleaned = fullName.replace(/[^\w\s.'.()-]/g, '').trim();
    if (cleaned.length >= 3) return cleaned.slice(0, 50);
    return 'Member';
  }

  private invoiceCustomerContact(mobile: string | null, region?: Region) {
    if (!mobile?.trim()) return null;
    const digits = mobile.replace(/\D/g, '');
    if (!digits) return null;
    // Never force +91 on international members — that rejects valid foreign numbers.
    if (region === Region.OutsideIndia) {
      if (mobile.trim().startsWith('+')) return `+${digits}`;
      if (digits.length > 10) return `+${digits}`;
      return digits;
    }
    if (digits.length === 10) return `+91${digits}`;
    if (mobile.trim().startsWith('+')) return `+${digits}`;
    return digits;
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
        payment_capture: true,
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

  /**
   * Last inclusive day of a membership term: start + N months − 1 day
   * (e.g. 27 Sep 2026 for 12 months → valid until 26 Sep 2027).
   * End-of-day so the full last calendar day remains accessible.
   */
  private membershipEndsAt(startsAt: Date, months: number) {
    const ends = this.addMonths(startsAt, months);
    ends.setDate(ends.getDate() - 1);
    ends.setHours(23, 59, 59, 999);
    return ends;
  }

  /** Day after a term ends — used as the next membership start. */
  private dayAfter(date: Date) {
    const next = new Date(date.getTime());
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  private startOfLocalDay(date: Date) {
    const next = new Date(date.getTime());
    next.setHours(0, 0, 0, 0);
    return next;
  }

  /** True when `date`'s calendar day is today or earlier. */
  private isOnOrBeforeCalendarDay(date: Date, now: Date) {
    return (
      this.startOfLocalDay(date).getTime() <=
      this.startOfLocalDay(now).getTime()
    );
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
