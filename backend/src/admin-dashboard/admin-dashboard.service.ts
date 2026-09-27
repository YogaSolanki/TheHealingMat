import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { CouponRedemption } from '../coupons/coupon-redemption.entity';
import { Coupon } from '../coupons/coupon.entity';
import { Membership } from '../payments/membership.entity';
import { PaymentOrder } from '../payments/payment-order.entity';
import { RewardRedemptionRequest } from '../referrals/reward-redemption-request.entity';
import { OrientationSlot } from '../trials/orientation-slot.entity';
import { TrialCohort } from '../trials/trial-cohort.entity';
import { TrialRegistration } from '../trials/trial-registration.entity';
import { Region } from '../users/enums/region.enum';
import { TrialStatus } from '../users/enums/trial-status.enum';
import { OtpChallenge } from '../users/otp-challenge.entity';
import { User } from '../users/user.entity';
import { UpdateAdminMembershipDto } from './dto/update-admin-membership.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
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
      memberships: memberships.map((membership) => ({
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
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
      })),
      payments: payments.map((payment) => ({
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
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })),
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

    await this.users.save(user);
    return this.getUserDetail(id);
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

    if (dto.status !== undefined) {
      membership.status = dto.status;
    }
    if (dto.startsAt !== undefined) {
      membership.startsAt = new Date(dto.startsAt);
    }
    if (dto.endsAt !== undefined) {
      membership.endsAt = new Date(dto.endsAt);
    }
    if (dto.planMonths !== undefined) {
      membership.planMonths = dto.planMonths;
    }
    if (dto.planName !== undefined) {
      membership.planName = dto.planName.trim();
    }

    if (membership.endsAt.getTime() <= membership.startsAt.getTime()) {
      throw new BadRequestException('endsAt must be after startsAt.');
    }

    await this.memberships.save(membership);
    return this.getUserDetail(userId);
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
    const base = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return `${base.replace(/\/$/, '')}/u/${token}`;
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
