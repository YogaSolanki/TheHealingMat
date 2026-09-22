import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { TrialStatus } from '../users/enums/trial-status.enum';
import {
  FREE_TRIAL_DAYS,
  cohortLabelForStart,
  nextFirstOrThirdMonday,
  trialEndsAtFromStart,
} from './cohort-schedule';
import { RegisterTrialDto } from './dto/register-trial.dto';
import { OrientationSlot } from './orientation-slot.entity';
import { TrialCohort } from './trial-cohort.entity';
import { TrialMessagingService } from './trial-messaging.service';
import { TrialRegistration } from './trial-registration.entity';

export { FREE_TRIAL_DAYS };

@Injectable()
export class TrialsService {
  private readonly logger = new Logger(TrialsService.name);

  constructor(
    @InjectRepository(TrialCohort)
    private readonly cohorts: Repository<TrialCohort>,
    @InjectRepository(OrientationSlot)
    private readonly slots: Repository<OrientationSlot>,
    @InjectRepository(TrialRegistration)
    private readonly registrations: Repository<TrialRegistration>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly messaging: TrialMessagingService,
  ) {}

  /**
   * Ensures the member has a 14-day trial on the next 1st/3rd Monday cohort.
   * Idempotent: existing registrations are only status-refreshed.
   */
  async ensureFreeTrial(user: User): Promise<User> {
    const existing = await this.registrations.findOne({
      where: { userId: user.id },
    });

    if (existing) {
      const refreshed = this.refreshStatus(existing);
      if (refreshed.status !== existing.status) {
        await this.registrations.save(refreshed);
      }
      if (!user.hasUsedFreeTrial) {
        user.hasUsedFreeTrial = true;
        return this.users.save(user);
      }
      return user;
    }

    if (user.hasUsedFreeTrial) {
      return user;
    }

    const now = new Date();
    const trialStartsAt = nextFirstOrThirdMonday(now);
    const trialEndsAt = trialEndsAtFromStart(trialStartsAt);
    const cohort = await this.findOrCreateCohort(trialStartsAt, trialEndsAt);
    const status =
      trialStartsAt.getTime() > now.getTime()
        ? TrialStatus.Scheduled
        : TrialStatus.Active;

    const registration = await this.registrations.save(
      this.registrations.create({
        userId: user.id,
        cohortId: cohort.id,
        orientationSlotId: null,
        status,
        trialStartsAt,
        trialEndsAt,
        welcomeMessageSentAt: null,
        reminderSentAt: null,
      }),
    );

    user.hasUsedFreeTrial = true;
    const saved = await this.users.save(user);

    void this.messaging.sendWelcome(saved, registration).catch((err) => {
      this.logger.warn(
        `Welcome message failed for ${saved.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });

    return saved;
  }

  async getNextCohort() {
    const now = new Date();
    let cohort = await this.cohorts
      .createQueryBuilder('cohort')
      .leftJoinAndSelect('cohort.orientationSlots', 'slot')
      .where('cohort.isOpen = :isOpen', { isOpen: true })
      .andWhere('cohort.registrationOpensAt <= :now', { now })
      .andWhere('cohort.endsAt > :now', { now })
      .orderBy('cohort.startsAt', 'ASC')
      .addOrderBy('slot.startsAt', 'ASC')
      .getOne();

    if (!cohort) {
      const startsAt = nextFirstOrThirdMonday(now);
      const endsAt = trialEndsAtFromStart(startsAt);
      cohort = await this.findOrCreateCohort(startsAt, endsAt);
      cohort = await this.cohorts.findOne({
        where: { id: cohort.id },
        relations: { orientationSlots: true },
      });
    }

    if (!cohort) {
      throw new NotFoundException('No upcoming trial cohort is available.');
    }

    const availableSlots = (cohort.orientationSlots ?? []).filter(
      (slot) => slot.bookedCount < slot.capacity,
    );

    return {
      cohort: {
        id: cohort.id,
        label: cohort.label,
        startsAt: cohort.startsAt,
        endsAt: cohort.endsAt,
        registrationOpensAt: cohort.registrationOpensAt,
      },
      orientationSlots: availableSlots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        startsAt: slot.startsAt,
        seatsLeft: slot.capacity - slot.bookedCount,
      })),
      note: 'Orientation choice is only for orientation; it does not restrict regular session access.',
    };
  }

  /**
   * Starts the standard free trial for an eligible logged-in member.
   * Same cohort / messaging path as signup via ensureFreeTrial.
   */
  async startFreeTrial(user: User) {
    if (user.hasUsedFreeTrial) {
      throw new ConflictException(
        'One Free Trial per user. This account has already used its trial.',
      );
    }

    const updated = await this.ensureFreeTrial(user);
    return this.getMyTrial(updated);
  }

  async register(user: User, dto: RegisterTrialDto) {
    if (user.hasUsedFreeTrial) {
      throw new ConflictException(
        'One Free Trial per user. This account has already used its trial.',
      );
    }

    const existing = await this.registrations.findOne({
      where: { userId: user.id },
    });
    if (existing) {
      throw new ConflictException(
        'This account already has a trial registration.',
      );
    }

    const slot = await this.slots.findOne({
      where: { id: dto.orientationSlotId },
      relations: { cohort: true },
    });
    if (!slot || !slot.cohort) {
      throw new NotFoundException('Orientation slot not found.');
    }

    const cohort = slot.cohort;
    const now = new Date();

    if (!cohort.isOpen || cohort.endsAt <= now) {
      throw new BadRequestException('This cohort is no longer open.');
    }
    if (cohort.registrationOpensAt > now) {
      throw new BadRequestException('Registration for this cohort is not open yet.');
    }
    if (slot.bookedCount >= slot.capacity) {
      throw new ConflictException('This orientation slot is full.');
    }

    const status =
      cohort.startsAt > now ? TrialStatus.Scheduled : TrialStatus.Active;

    const registration = await this.registrations.save(
      this.registrations.create({
        userId: user.id,
        cohortId: cohort.id,
        orientationSlotId: slot.id,
        status,
        trialStartsAt: cohort.startsAt,
        trialEndsAt: cohort.endsAt,
      }),
    );

    slot.bookedCount += 1;
    await this.slots.save(slot);

    user.hasUsedFreeTrial = true;
    await this.users.save(user);

    void this.messaging.sendWelcome(user, registration).catch((err) => {
      this.logger.warn(
        `Welcome message failed for ${user.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });

    return {
      hasTrial: true as const,
      ...this.toTrialAccount(user, registration, cohort, slot),
    };
  }

  async getMyTrial(user: User) {
    const registration = await this.registrations.findOne({
      where: { userId: user.id },
      relations: { cohort: true, orientationSlot: true },
    });

    if (!registration) {
      return {
        hasTrial: false as const,
        account: this.toBasicAccount(user),
      };
    }

    const refreshed = this.refreshStatus(registration);
    if (refreshed.status !== registration.status) {
      await this.registrations.save(refreshed);
    }

    return {
      hasTrial: true as const,
      ...this.toTrialAccount(
        user,
        refreshed,
        registration.cohort,
        registration.orientationSlot,
      ),
    };
  }

  private async findOrCreateCohort(
    startsAt: Date,
    endsAt: Date,
  ): Promise<TrialCohort> {
    const existing = await this.cohorts
      .createQueryBuilder('cohort')
      .where('cohort.startsAt = :startsAt', { startsAt })
      .getOne();
    if (existing) {
      if (!existing.isOpen) {
        existing.isOpen = true;
        return this.cohorts.save(existing);
      }
      return existing;
    }

    return this.cohorts.save(
      this.cohorts.create({
        label: cohortLabelForStart(startsAt),
        startsAt,
        endsAt,
        registrationOpensAt: new Date(0),
        isOpen: true,
      }),
    );
  }

  private refreshStatus(registration: TrialRegistration): TrialRegistration {
    const now = new Date();
    if (now > registration.trialEndsAt) {
      registration.status = TrialStatus.Expired;
    } else if (now >= registration.trialStartsAt) {
      registration.status = TrialStatus.Active;
    } else {
      registration.status = TrialStatus.Scheduled;
    }
    return registration;
  }

  private toBasicAccount(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      region: user.region,
      mobile: user.mobile,
      email: user.email,
      referralCode: user.referralCode,
      accessLink: this.buildAccessLink(user.accessLinkToken),
      hasUsedFreeTrial: user.hasUsedFreeTrial,
    };
  }

  private toTrialAccount(
    user: User,
    registration: TrialRegistration,
    cohort: TrialCohort | null,
    slot: OrientationSlot | null,
  ) {
    return {
      account: this.toBasicAccount(user),
      trial: {
        id: registration.id,
        status: registration.status,
        cohortLabel: cohort?.label ?? '14-Day Free Trial',
        trialStartsAt: registration.trialStartsAt,
        trialEndsAt: registration.trialEndsAt,
        orientation: slot
          ? {
              id: slot.id,
              label: slot.label,
              startsAt: slot.startsAt,
            }
          : null,
        registeredAt: registration.registeredAt,
      },
    };
  }

  private buildAccessLink(token: string): string {
    const base = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return `${base.replace(/\/$/, '')}/u/${token}`;
  }
}
