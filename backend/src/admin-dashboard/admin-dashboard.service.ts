import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt, randomUUID } from 'crypto';
import { DataSource, In, Not, Repository } from 'typeorm';
import { CouponRedemption } from '../coupons/coupon-redemption.entity';
import { Coupon } from '../coupons/coupon.entity';
import { isValidPassword, PASSWORD_MESSAGE } from '../auth/dto/password.rules';
import { Membership } from '../payments/membership.entity';
import { MembershipPlansService } from '../payments/membership-plans.service';
import { InvoicesService } from '../payments/invoices.service';
import { PaymentOrder } from '../payments/payment-order.entity';
import { PaymentsService } from '../payments/payments.service';
import { RewardRedemptionRequest } from '../referrals/reward-redemption-request.entity';
import { OrientationSlot } from '../trials/orientation-slot.entity';
import { TrialCohort } from '../trials/trial-cohort.entity';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { TrialsService } from '../trials/trials.service';
import {
  buildAccessLinkSlug,
  buildReferralCode,
  isUniqueViolation,
} from '../users/account-identity';
import { buildMemberAccessLink } from '../common/frontend-url';
import { Region } from '../users/enums/region.enum';
import { TrialStatus } from '../users/enums/trial-status.enum';
import { OtpChallenge } from '../users/otp-challenge.entity';
import { User } from '../users/user.entity';
import { CreateAdminMembershipDto } from './dto/create-admin-membership.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminMembershipDto } from './dto/update-admin-membership.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpgradeAdminMembershipDto } from './dto/upgrade-admin-membership.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly membershipPlans: MembershipPlansService,
    private readonly payments: PaymentsService,
    private readonly invoices: InvoicesService,
    private readonly trialsService: TrialsService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(TrialRegistration)
    private readonly trials: Repository<TrialRegistration>,
    @InjectRepository(TrialCohort)
    private readonly cohorts: Repository<TrialCohort>,
    @InjectRepository(OrientationSlot)
    private readonly slots: Repository<OrientationSlot>,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
    @InjectRepository(PaymentOrder)
    private readonly paymentOrders: Repository<PaymentOrder>,
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

  async getUserDetail(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const [trial, memberships, payments, referralCount] = await Promise.all([
      this.trials.findOne({
        where: { userId: id },
        relations: { cohort: true, orientationSlot: true },
      }),
      this.memberships.find({
        where: { userId: id },
        order: { createdAt: 'DESC' },
      }),
      this.paymentOrders.find({
        where: { userId: id },
        order: { createdAt: 'DESC' },
      }),
      this.users.count({ where: { referredByUserId: id } }),
    ]);

    const invoiceRows = await this.invoices.findByMembershipIds(
      memberships.map((m) => m.id),
    );
    const invoiceByMembershipId = new Map(
      invoiceRows
        .filter((row) => row.membershipId)
        .map((row) => [row.membershipId as string, row]),
    );

    let referredBy: { id: string; fullName: string; referralCode: string } | null =
      null;
    if (user.referredByUserId) {
      const referrer = await this.users.findOne({
        where: { id: user.referredByUserId },
        select: { id: true, fullName: true, referralCode: true },
      });
      if (referrer) {
        referredBy = {
          id: referrer.id,
          fullName: referrer.fullName,
          referralCode: referrer.referralCode,
        };
      }
    }

    return {
      profile: {
        id: user.id,
        fullName: user.fullName,
        region: user.region,
        mobile: user.mobile,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        state: user.state,
        preferredClassTime: user.preferredClassTime,
        referralCode: user.referralCode,
        accessLink: this.buildAccessLink(user.accessLinkToken),
        accessLinkToken: user.accessLinkToken,
        hasUsedFreeTrial: user.hasUsedFreeTrial,
        passwordSetByUser: user.passwordSetByUser,
        referredByUserId: user.referredByUserId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      referredBy,
      referralCount,
      trial: trial
        ? {
            id: trial.id,
            status: trial.status,
            trialStartsAt: trial.trialStartsAt,
            trialEndsAt: trial.trialEndsAt,
            registeredAt: trial.registeredAt,
            cohortLabel: trial.cohort?.label ?? null,
            orientationLabel: trial.orientationSlot?.label ?? null,
          }
        : null,
      memberships: memberships.map((membership) => {
        const invoice = invoiceByMembershipId.get(membership.id) ?? null;
        return {
          id: membership.id,
          planMonths: membership.planMonths,
          planName: membership.planName,
          listPricePaise: membership.listPricePaise,
          discountPaise: membership.discountPaise,
          amountPaidPaise: membership.amountPaidPaise,
          currency: membership.currency,
          status: membership.status,
          startsAt: membership.startsAt,
          endsAt: membership.endsAt,
          paymentOrderId: membership.paymentOrderId,
          razorpayPaymentId: membership.razorpayPaymentId,
          razorpayInvoiceId: membership.razorpayInvoiceId,
          razorpayInvoiceUrl: membership.razorpayInvoiceUrl,
          paymentMethod: membership.paymentMethod,
          adminNote: membership.adminNote,
          invoiceNumber: invoice?.invoiceNumber ?? null,
          invoiceCategory: invoice?.category ?? null,
          createdAt: membership.createdAt,
          updatedAt: membership.updatedAt,
        };
      }),
      payments: payments.map((payment) => {
        const membership =
          memberships.find((row) => row.paymentOrderId === payment.id) ?? null;
        const invoice = membership
          ? (invoiceByMembershipId.get(membership.id) ?? null)
          : null;
        return {
          id: payment.id,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpayInvoiceId: payment.razorpayInvoiceId,
          razorpayInvoiceUrl: payment.razorpayInvoiceUrl,
          amountPaise: payment.amountPaise,
          currency: payment.currency,
          receipt: payment.receipt,
          planMonths: payment.planMonths,
          couponCode: payment.couponCode,
          startMode: payment.startMode,
          startsOn: payment.startsOn,
          listPricePaise: payment.listPricePaise,
          discountPaise: payment.discountPaise,
          status: payment.status,
          membershipId: membership?.id ?? null,
          invoiceNumber: invoice?.invoiceNumber ?? null,
          source: 'razorpay' as const,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        };
      }),
    };
  }

  async getMembershipInvoice(userId: string, membershipId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return this.payments.getInvoice(user, membershipId);
  }

  async checkUserExists(input: { mobile?: string; email?: string }) {
    const mobile = input.mobile?.trim()
      ? this.normalizeMobile(input.mobile)
      : null;
    const email = input.email?.trim().toLowerCase() || null;

    let mobileTaken = false;
    let emailTaken = false;
    let existingUserId: string | null = null;
    let existingFullName: string | null = null;

    if (mobile) {
      const row = await this.users.findOne({
        where: { mobile },
        select: { id: true, fullName: true },
      });
      if (row) {
        mobileTaken = true;
        existingUserId = row.id;
        existingFullName = row.fullName;
      }
    }

    if (email) {
      const row = await this.users.findOne({
        where: { email },
        select: { id: true, fullName: true },
      });
      if (row) {
        emailTaken = true;
        if (!existingUserId) {
          existingUserId = row.id;
          existingFullName = row.fullName;
        }
      }
    }

    let message: string | null = null;
    if (mobileTaken && emailTaken) {
      message = 'User already exists with this mobile number and email.';
    } else if (mobileTaken) {
      message = 'User already exists with this mobile number.';
    } else if (emailTaken) {
      message = 'User already exists with this email.';
    }

    return {
      mobileTaken,
      emailTaken,
      exists: mobileTaken || emailTaken,
      message,
      existingUserId,
      existingFullName,
    };
  }

  async createUser(dto: CreateAdminUserDto) {
    const fullName = dto.fullName.trim();
    if (fullName.length < 2) {
      throw new BadRequestException('fullName must be at least 2 characters.');
    }

    const mobile = dto.mobile?.trim()
      ? this.normalizeMobile(dto.mobile)
      : null;
    let email = dto.email?.trim().toLowerCase() || null;

    if (dto.region === Region.India && !mobile) {
      throw new BadRequestException('Mobile number is required for India accounts.');
    }
    if (dto.region === Region.OutsideIndia && !email) {
      throw new BadRequestException(
        'Email is required for outside-India accounts.',
      );
    }
    if (!mobile && !email) {
      throw new BadRequestException(
        'Provide at least a mobile number or email.',
      );
    }

    if (mobile) {
      const taken = await this.users.exists({ where: { mobile } });
      if (taken) {
        throw new BadRequestException(
          'User already exists with this mobile number.',
        );
      }
    }
    if (email) {
      const taken = await this.users.exists({ where: { email } });
      if (taken) {
        // Email is optional for India — skip conflicting email instead of blocking create.
        if (mobile) {
          email = null;
        } else {
          throw new BadRequestException('User already exists with this email.');
        }
      }
    }

    const providedPassword = dto.password?.trim();
    let temporaryPassword: string | null = null;
    let password: string;
    let passwordSetByUser = false;
    if (providedPassword) {
      if (!isValidPassword(providedPassword)) {
        throw new BadRequestException(
          'Password must be 8–72 characters and include uppercase, lowercase, and a number.',
        );
      }
      password = providedPassword;
      passwordSetByUser = true;
    } else {
      password = `Thm1A-${randomBytes(16).toString('base64url')}`;
      temporaryPassword = password;
    }

    const referredByUserId = await this.findReferrerId(dto.referralCode);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let user: User | null = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const referralCode = await this.allocateUniqueReferralCode(fullName);
      const accessLinkToken = await this.allocateUniqueAccessLinkSlug(fullName);
      try {
        user = await this.users.save(
          this.users.create({
            region: dto.region,
            fullName,
            mobile,
            email,
            passwordHash,
            passwordSetByUser,
            referralCode,
            accessLinkToken,
            referredByUserId,
            hasUsedFreeTrial: false,
            role: 'user',
            dateOfBirth: dto.dateOfBirth?.trim() || null,
            gender: dto.gender ?? null,
            state: dto.state?.trim() || null,
            preferredClassTime: dto.preferredClassTime?.trim() || null,
          }),
        );
        break;
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === 39) {
          throw error;
        }
      }
    }

    if (!user) {
      throw new ServiceUnavailableException(
        'Unable to create a unique account identifier. Please try again.',
      );
    }

    if (dto.startFreeTrial) {
      await this.trialsService.ensureFreeTrial(user);
    }

    const detail = await this.getUserDetail(user.id);
    return {
      ...detail,
      temporaryPassword,
    };
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
    if (dto.region !== undefined) {
      user.region = dto.region;
    }
    if (dto.dateOfBirth !== undefined) {
      user.dateOfBirth = dto.dateOfBirth?.trim() || null;
    }
    if (dto.gender !== undefined) {
      user.gender = dto.gender ?? null;
    }
    if (dto.state !== undefined) {
      user.state = dto.state?.trim() || null;
    }
    if (dto.preferredClassTime !== undefined) {
      user.preferredClassTime = dto.preferredClassTime?.trim() || null;
    }
    if (dto.hasUsedFreeTrial !== undefined) {
      user.hasUsedFreeTrial = dto.hasUsedFreeTrial;
    }

    if (dto.email !== undefined) {
      const nextEmail = dto.email?.trim().toLowerCase() || null;
      if (nextEmail) {
        const taken = await this.users.exists({
          where: { email: nextEmail, id: Not(id) },
        });
        if (taken) {
          throw new BadRequestException(
            'Another account already uses this email.',
          );
        }
      }
      user.email = nextEmail;
    }

    if (dto.mobile !== undefined) {
      const nextMobile = dto.mobile?.trim() || null;
      if (nextMobile) {
        const taken = await this.users.exists({
          where: { mobile: nextMobile, id: Not(id) },
        });
        if (taken) {
          throw new BadRequestException(
            'Another account already uses this mobile number.',
          );
        }
      }
      user.mobile = nextMobile;
    }

    if (!user.email && !user.mobile) {
      throw new BadRequestException(
        'User must keep at least an email or mobile number.',
      );
    }

    const nextPassword = dto.password?.trim();
    if (nextPassword) {
      if (!isValidPassword(nextPassword)) {
        throw new BadRequestException(PASSWORD_MESSAGE);
      }
      const passwordHash = await bcrypt.hash(nextPassword, BCRYPT_ROUNDS);
      await this.users
        .createQueryBuilder()
        .update(User)
        .set({ passwordHash, passwordSetByUser: true })
        .where('id = :id', { id })
        .execute();
    }

    await this.users.save(user);
    return this.getUserDetail(id);
  }

  async createMembership(userId: string, dto: CreateAdminMembershipDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const plan =
      (await this.membershipPlans.findByMonths(dto.planMonths)) ?? null;
    if (!plan) {
      throw new BadRequestException(
        `No membership plan found for ${dto.planMonths} months.`,
      );
    }
    const planName = plan.name;

    let payment: PaymentOrder | null = null;
    if (dto.paymentOrderId) {
      payment = await this.paymentOrders.findOne({
        where: { id: dto.paymentOrderId, userId },
      });
      if (!payment) {
        throw new NotFoundException('Payment order not found for this user.');
      }
      const existing = await this.memberships.findOne({
        where: { paymentOrderId: payment.id },
      });
      if (existing) {
        throw new BadRequestException(
          'This payment order already has a membership. Edit that membership instead.',
        );
      }
    }

    const mode = dto.mode ?? (dto.status === 'scheduled' ? 'renew' : 'add');
    const now = new Date();
    let status: 'active' | 'scheduled' = dto.status ?? 'active';
    let startsAt: Date;

    if (mode === 'renew') {
      await this.assertCanScheduleRenewal(userId);
      const active = await this.findActiveMembership(userId);
      if (!active) {
        throw new BadRequestException(
          'Renew requires an active membership. Add a membership first.',
        );
      }
      status = 'scheduled';
      startsAt = this.dayAfter(active.endsAt);
      if (startsAt.getTime() <= now.getTime()) {
        // Current term already ended — start immediately instead.
        status = 'active';
        startsAt = this.startOfLocalDay(now);
      }
    } else if (status === 'active') {
      startsAt = this.startOfLocalDay(now);
    } else {
      await this.assertCanScheduleRenewal(userId);
      if (!dto.startsAt) {
        throw new BadRequestException(
          'startsAt is required when status is scheduled.',
        );
      }
      startsAt = new Date(dto.startsAt);
      if (Number.isNaN(startsAt.getTime())) {
        throw new BadRequestException('startsAt must be a valid date.');
      }
      startsAt = this.startOfLocalDay(startsAt);
      if (startsAt.getTime() <= this.startOfLocalDay(now).getTime()) {
        throw new BadRequestException(
          'Scheduled start date must be in the future. Use active to start now.',
        );
      }
    }

    const endsAt = this.membershipEndsAt(startsAt, dto.planMonths);
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('endsAt must be after startsAt.');
    }

    const adminNote = dto.adminNote?.trim();
    if (!adminNote || adminNote.length < 3) {
      throw new BadRequestException(
        'Admin note is required (why this membership was created manually).',
      );
    }

    const currency =
      dto.currency?.toUpperCase() ||
      payment?.currency ||
      (user.region === Region.OutsideIndia ? 'USD' : 'INR');
    const catalogListPrice =
      currency === 'USD'
        ? (plan.listPriceUsdCents ?? 0)
        : (plan.listPricePaise ?? 0);
    const listPricePaise =
      dto.listPricePaise ?? payment?.listPricePaise ?? catalogListPrice;
    const discountPaise =
      dto.discountPaise ?? payment?.discountPaise ?? 0;
    const amountPaidPaise =
      dto.amountPaidPaise ??
      payment?.amountPaise ??
      Math.max(0, listPricePaise - discountPaise);

    if (discountPaise > listPricePaise) {
      throw new BadRequestException('Discount cannot exceed list price.');
    }
    if (amountPaidPaise > listPricePaise) {
      throw new BadRequestException(
        'Amount paid cannot exceed list price.',
      );
    }

    const billingLocation =
      dto.billingLocation?.trim() || user.state?.trim() || null;
    if (!billingLocation) {
      throw new BadRequestException(
        user.region === Region.OutsideIndia
          ? 'Country is required for the invoice. Add it on the profile or enter billing location here.'
          : 'State is required for the invoice. Add it on the profile or enter billing location here.',
      );
    }
    if (!user.state?.trim() && dto.billingLocation?.trim()) {
      user.state = dto.billingLocation.trim();
      await this.users.save(user);
    }

    const paymentMethod =
      dto.paymentMethod?.trim() ||
      (payment ? 'Online (Razorpay)' : null);
    const paymentRef =
      dto.paymentRef?.trim() || payment?.razorpayPaymentId || null;

    if (amountPaidPaise > 0) {
      if (!paymentMethod) {
        throw new BadRequestException(
          'Payment method is required when amount paid is greater than zero.',
        );
      }
      if (!paymentRef) {
        throw new BadRequestException(
          'Payment reference is required when amount paid is greater than zero.',
        );
      }
    }

    if (payment && payment.status !== 'paid') {
      payment.status = 'paid';
      await this.paymentOrders.save(payment);
    }

    let razorpayInvoiceId = payment?.razorpayInvoiceId ?? null;
    let razorpayInvoiceUrl = payment?.razorpayInvoiceUrl ?? null;
    let razorpayPaymentId = paymentRef;

    if (paymentRef?.startsWith('pay_')) {
      const resolved =
        await this.payments.resolveRazorpayPaymentInvoice(paymentRef);
      if (resolved) {
        razorpayPaymentId = resolved.paymentId;
        if (resolved.invoiceId) razorpayInvoiceId = resolved.invoiceId;
        if (resolved.invoiceUrl) razorpayInvoiceUrl = resolved.invoiceUrl;
      }
    }

    const membership = await this.memberships.save(
      this.memberships.create({
        userId,
        planMonths: dto.planMonths,
        planName,
        listPricePaise,
        discountPaise,
        amountPaidPaise,
        currency,
        status,
        startsAt,
        endsAt,
        paymentOrderId: payment?.id ?? `admin-manual-${randomUUID()}`,
        razorpayPaymentId,
        razorpayInvoiceId,
        razorpayInvoiceUrl,
        paymentMethod,
        adminNote,
      }),
    );

    if (status === 'active') {
      await this.supersedeOtherActiveMemberships(userId, membership.id);
      await this.completeTrialForMembership(userId);
    }

    const invoice = await this.invoices.ensureMembershipInvoice({
      membership,
      user,
      paymentMethod: paymentMethod || 'Admin assigned',
      paymentReference: amountPaidPaise > 0 ? razorpayPaymentId : null,
      discountLabel: payment?.couponCode?.trim() || null,
    });

    if (amountPaidPaise > 0 && !invoice) {
      throw new BadRequestException(
        'Membership was created but invoice could not be issued. Please try again.',
      );
    }

    return this.getUserDetail(userId);
  }

  /**
   * Recover a paid (or captured) order that never created a membership row.
   */
  async activateMembershipFromPayment(
    userId: string,
    paymentOrderId: string,
  ) {
    const payment = await this.paymentOrders.findOne({
      where: { id: paymentOrderId, userId },
    });
    if (!payment) {
      throw new NotFoundException('Payment order not found for this user.');
    }
    if (payment.planMonths == null) {
      throw new BadRequestException(
        'This payment order is not a membership purchase.',
      );
    }

    const existing = await this.memberships.findOne({
      where: { paymentOrderId: payment.id },
    });
    if (existing) {
      throw new BadRequestException(
        'This payment order already has a membership. Edit that membership instead.',
      );
    }

    return this.createMembership(userId, {
      planMonths: payment.planMonths,
      paymentOrderId: payment.id,
      amountPaidPaise: payment.amountPaise,
      currency: payment.currency,
      status: 'active',
      adminNote: 'Activated from existing paid payment order.',
      paymentMethod: 'Online (Razorpay)',
      paymentRef: payment.razorpayPaymentId ?? undefined,
    });
  }

  async updateMembership(
    userId: string,
    membershipId: string,
    dto: UpdateAdminMembershipDto,
  ) {
    const membership = await this.memberships.findOne({
      where: { id: membershipId, userId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    if (
      dto.planMonths !== undefined &&
      dto.planMonths !== membership.planMonths
    ) {
      throw new BadRequestException(
        'Use Upgrade to change plan duration. Upgrade creates a new membership on top of the current one and does not overwrite it.',
      );
    }
    if (
      dto.planName !== undefined &&
      dto.planName.trim() !== membership.planName
    ) {
      throw new BadRequestException(
        'Use Upgrade to change the plan. Upgrade creates a new membership on top of the current one.',
      );
    }

    if (dto.status !== undefined) {
      membership.status = dto.status;
    }
    if (dto.startsAt !== undefined) {
      membership.startsAt = new Date(dto.startsAt);
    }
    if (dto.endsAt !== undefined) {
      membership.endsAt = new Date(dto.endsAt);
    }

    if (membership.endsAt.getTime() <= membership.startsAt.getTime()) {
      throw new BadRequestException('endsAt must be after startsAt.');
    }

    await this.memberships.save(membership);

    if (membership.status === 'active') {
      await this.supersedeOtherActiveMemberships(userId, membership.id);
      await this.completeTrialForMembership(userId);
    }

    return this.getUserDetail(userId);
  }

  /**
   * Upgrade to a longer plan without overwriting the source membership.
   * Creates a new membership on top (same start, longer end) and retires the
   * previous record with its original plan/dates/payment/invoice kept intact.
   * Admin can record the additional payment for the upgrade; a separate
   * "Membership Upgrade" invoice is issued when that amount is greater than zero.
   * Allowed: 3→6, 3→12, 6→12. Same or shorter duration is rejected.
   */
  async upgradeMembership(
    userId: string,
    membershipId: string,
    dto: UpgradeAdminMembershipDto,
  ) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const source = await this.memberships.findOne({
      where: { id: membershipId, userId },
    });
    if (!source) {
      throw new NotFoundException('Membership not found.');
    }
    if (source.status !== 'active' && source.status !== 'scheduled') {
      throw new BadRequestException(
        'Only the current membership or a scheduled renew can be upgraded.',
      );
    }

    const nextMonths = dto.planMonths;
    if (!Number.isInteger(nextMonths) || nextMonths < 1) {
      throw new BadRequestException('Select a valid longer plan.');
    }
    if (nextMonths <= source.planMonths) {
      throw new BadRequestException(
        'Upgrade must be to a longer plan. A longer membership cannot be changed to a shorter one.',
      );
    }

    const plan =
      (await this.membershipPlans.findByMonths(nextMonths)) ?? null;
    if (!plan) {
      throw new BadRequestException(
        `No membership plan found for ${nextMonths} months.`,
      );
    }

    const startsAt = new Date(source.startsAt);
    const endsAt = this.membershipEndsAt(startsAt, nextMonths);
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('endsAt must be after startsAt.');
    }

    const currency =
      source.currency?.toUpperCase() ||
      (user.region === Region.OutsideIndia ? 'USD' : 'INR');
    const catalogListPrice =
      currency === 'USD'
        ? (plan.listPriceUsdCents ?? 0)
        : (plan.listPricePaise ?? 0);
    const alreadyPaidPaise = Math.max(0, source.amountPaidPaise ?? 0);

    const listPricePaise = dto.listPricePaise ?? catalogListPrice;
    if (listPricePaise < 0) {
      throw new BadRequestException('List price cannot be negative.');
    }

    // Discount defaults to prior payment credit; admin may increase (extra discount).
    const defaultCredit = Math.min(alreadyPaidPaise, listPricePaise);
    const discountPaise = dto.discountPaise ?? defaultCredit;
    if (discountPaise < 0) {
      throw new BadRequestException('Discount cannot be negative.');
    }
    if (discountPaise > listPricePaise) {
      throw new BadRequestException('Discount cannot exceed the new plan price.');
    }

    const expectedAdditional = Math.max(0, listPricePaise - discountPaise);
    const amountPaidPaise = dto.amountPaidPaise ?? expectedAdditional;
    if (amountPaidPaise < 0) {
      throw new BadRequestException('Additional amount cannot be negative.');
    }
    if (amountPaidPaise > listPricePaise) {
      throw new BadRequestException(
        'Additional amount cannot exceed the new plan price.',
      );
    }
    if (amountPaidPaise !== expectedAdditional) {
      throw new BadRequestException(
        'Additional amount must equal new plan price minus discount.',
      );
    }

    const priorCredit = defaultCredit;
    const extraDiscount = Math.max(0, discountPaise - priorCredit);
    let upgradeDiscountLabel = `Prior ${source.planMonths}-month payment`;
    if (extraDiscount > 0) {
      upgradeDiscountLabel += ' + admin discount';
    }

    const paymentMethod = dto.paymentMethod?.trim() || null;
    const paymentRef = dto.paymentRef?.trim() || null;

    if (amountPaidPaise > 0) {
      if (!paymentMethod) {
        throw new BadRequestException(
          'Payment method is required when recording an additional upgrade payment.',
        );
      }
      if (!paymentRef) {
        throw new BadRequestException(
          'Payment reference is required when recording an additional upgrade payment.',
        );
      }
    }

    const noteFromAdmin = dto.adminNote?.trim();
    const adminNote =
      noteFromAdmin && noteFromAdmin.length >= 3
        ? noteFromAdmin
        : `Membership Upgrade: ${source.planMonths}-month → ${nextMonths}-month. Original payment ${alreadyPaidPaise / 100} ${currency} credited; additional ${amountPaidPaise / 100} ${currency} recorded. Previous membership kept intact.`;

    const planName = `Membership Upgrade (${source.planMonths} to ${nextMonths} months)`;

    let razorpayPaymentId = paymentRef;
    let razorpayInvoiceId: string | null = null;
    let razorpayInvoiceUrl: string | null = null;
    if (paymentRef?.startsWith('pay_')) {
      const resolved =
        await this.payments.resolveRazorpayPaymentInvoice(paymentRef);
      if (resolved) {
        razorpayPaymentId = resolved.paymentId;
        if (resolved.invoiceId) razorpayInvoiceId = resolved.invoiceId;
        if (resolved.invoiceUrl) razorpayInvoiceUrl = resolved.invoiceUrl;
      }
    }

    const upgraded = await this.memberships.save(
      this.memberships.create({
        userId,
        planMonths: nextMonths,
        planName,
        listPricePaise,
        discountPaise,
        amountPaidPaise,
        currency,
        status: source.status,
        startsAt,
        endsAt,
        paymentOrderId: `admin-upgrade-${randomUUID()}`,
        razorpayPaymentId: amountPaidPaise > 0 ? razorpayPaymentId : null,
        razorpayInvoiceId,
        razorpayInvoiceUrl,
        paymentMethod:
          amountPaidPaise > 0
            ? paymentMethod
            : 'Membership Upgrade (no additional payment)',
        adminNote,
      }),
    );

    // Retire the previous record without changing its plan, dates, payment, or invoice.
    source.status = 'expired';
    await this.memberships.save(source);

    if (upgraded.status === 'active') {
      await this.supersedeOtherActiveMemberships(userId, upgraded.id);
      await this.completeTrialForMembership(userId);
    }

    if (amountPaidPaise > 0) {
      const invoice = await this.invoices.ensureMembershipInvoice({
        membership: upgraded,
        user,
        paymentMethod: paymentMethod || 'Membership Upgrade',
        paymentReference: razorpayPaymentId,
        discountLabel: upgradeDiscountLabel,
      });
      if (!invoice) {
        throw new BadRequestException(
          'Upgrade was created but the Membership Upgrade invoice could not be issued. Please try again.',
        );
      }
    }

    return this.getUserDetail(userId);
  }

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

  /** Same rule as member checkout: only one scheduled next membership. */
  private async assertCanScheduleRenewal(userId: string) {
    const scheduled = await this.memberships.findOne({
      where: { userId, status: 'scheduled' },
    });
    if (scheduled) {
      throw new BadRequestException(
        'This member already has a scheduled next membership. Only one renew is allowed.',
      );
    }
  }

  private async findActiveMembership(userId: string) {
    const now = new Date();
    const membership = await this.memberships.findOne({
      where: { userId, status: 'active' },
      order: { endsAt: 'DESC' },
    });
    if (!membership || membership.endsAt < now) return null;
    return membership;
  }

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

  private addMonths(date: Date, months: number) {
    const next = new Date(date.getTime());
    next.setMonth(next.getMonth() + months);
    return next;
  }

  /** Last inclusive day of a membership term (matches payments service). */
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

  async deleteUser(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.dataSource.transaction(async (manager) => {
      const trial = await manager.findOne(TrialRegistration, {
        where: { userId: id },
        relations: { orientationSlot: true },
      });

      if (trial) {
        if (trial.orientationSlot) {
          trial.orientationSlot.bookedCount = Math.max(
            0,
            trial.orientationSlot.bookedCount - 1,
          );
          await manager.save(trial.orientationSlot);
        }
        await manager.remove(trial);
      }

      await manager.delete(Membership, { userId: id });
      await manager.delete(PaymentOrder, { userId: id });
      await manager.update(
        User,
        { referredByUserId: id },
        { referredByUserId: null },
      );

      const destinations = [user.mobile, user.email].filter(
        (value): value is string => Boolean(value),
      );
      if (destinations.length > 0) {
        await manager.delete(OtpChallenge, { destination: In(destinations) });
      }

      await manager.remove(user);
    });

    return { success: true };
  }

  async deleteAllUsers() {
    const deletedCount = await this.users.count();
    if (deletedCount === 0) {
      return { success: true, deletedCount: 0 };
    }

    await this.dataSource.transaction(async (manager) => {
      const trials = await manager.find(TrialRegistration, {
        relations: { orientationSlot: true },
      });

      for (const trial of trials) {
        if (trial.orientationSlot) {
          trial.orientationSlot.bookedCount = Math.max(
            0,
            trial.orientationSlot.bookedCount - 1,
          );
          await manager.save(trial.orientationSlot);
        }
      }

      await manager
        .createQueryBuilder()
        .delete()
        .from(TrialRegistration)
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(CouponRedemption)
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(RewardRedemptionRequest)
        .execute();
      await manager.createQueryBuilder().delete().from(Membership).execute();
      await manager.createQueryBuilder().delete().from(PaymentOrder).execute();
      await manager
        .createQueryBuilder()
        .update(Coupon)
        .set({ assignedUserId: null, assignedReferralCode: null })
        .execute();
      await manager
        .createQueryBuilder()
        .update(User)
        .set({ referredByUserId: null })
        .execute();
      await manager.createQueryBuilder().delete().from(OtpChallenge).execute();
      await manager.createQueryBuilder().delete().from(User).execute();
    });

    return { success: true, deletedCount };
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

  private buildAccessLink(token: string): string {
    return buildMemberAccessLink(
      this.config.get<string>('FRONTEND_URL'),
      token,
    );
  }

  private normalizeMobile(mobile: string): string {
    const trimmed = mobile.trim().replace(/[\s-]/g, '');
    if (trimmed.startsWith('+')) {
      return trimmed;
    }
    if (/^[6-9]\d{9}$/.test(trimmed)) {
      return `+91${trimmed}`;
    }
    return `+${trimmed}`;
  }

  private async findReferrerId(referralCode?: string) {
    const code = referralCode?.trim().toLowerCase();
    if (!code) return null;
    const referrer = await this.users.findOne({ where: { referralCode: code } });
    if (!referrer) {
      throw new BadRequestException('This referral code is not valid.');
    }
    return referrer.id;
  }

  private async allocateUniqueReferralCode(fullName: string) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const referralCode = buildReferralCode(fullName);
      const exists = await this.users.findOne({ where: { referralCode } });
      if (!exists) return referralCode;
    }
    throw new ServiceUnavailableException(
      'Unable to assign a unique referral code. Please try again.',
    );
  }

  private async allocateUniqueAccessLinkSlug(fullName: string) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const accessLinkToken =
        attempt < 20
          ? buildAccessLinkSlug(fullName)
          : `${buildAccessLinkSlug(fullName)}${randomInt(10, 99)}`;
      const exists = await this.users.findOne({ where: { accessLinkToken } });
      if (!exists) return accessLinkToken;
    }
    throw new ServiceUnavailableException(
      'Unable to assign a unique access link. Please try again.',
    );
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
