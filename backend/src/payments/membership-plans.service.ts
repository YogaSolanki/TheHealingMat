import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from '../users/enums/region.enum';
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
} from './dto/membership-plan.dto';
import { MembershipPlan } from './membership-plan.entity';
import { DEFAULT_MEMBERSHIP_PLANS } from './membership-plans';
import { MembershipOffersService } from './membership-offers.service';

@Injectable()
export class MembershipPlansService implements OnModuleInit {
  private readonly logger = new Logger(MembershipPlansService.name);

  constructor(
    @InjectRepository(MembershipPlan)
    private readonly plans: Repository<MembershipPlan>,
    private readonly offers: MembershipOffersService,
  ) {}

  async onModuleInit() {
    if ((await this.plans.count()) === 0) {
      await this.plans.save(
        DEFAULT_MEMBERSHIP_PLANS.map((row) => this.plans.create(row)),
      );
      this.logger.log('Seeded default membership plans.');
      return;
    }

    // Backfill USD prices on existing catalogs created before international pricing.
    for (const defaults of DEFAULT_MEMBERSHIP_PLANS) {
      const plan = await this.plans.findOne({ where: { months: defaults.months } });
      if (!plan) continue;
      if (plan.listPriceUsdCents > 0 && plan.perDayUsdCents > 0) continue;
      plan.listPriceUsdCents = defaults.listPriceUsdCents;
      plan.perDayUsdCents = defaults.perDayUsdCents;
      await this.plans.save(plan);
    }
  }

  listAdmin() {
    return this.plans.find({ order: { sortOrder: 'ASC', months: 'ASC' } });
  }

  async listPublic(region: Region = Region.India) {
    const rows = await this.plans.find({
      where: { active: true },
      order: { sortOrder: 'ASC', months: 'ASC' },
    });
    const offer =
      region === Region.India ? await this.offers.findCurrentOffer() : null;

    return {
      region,
      currency: region === Region.OutsideIndia ? ('USD' as const) : ('INR' as const),
      plans: rows.map((plan) => this.toPublic(plan, offer, region)),
      offer: offer
        ? {
            id: offer.id,
            title: offer.title,
            badge: offer.badge || offer.title,
            startsAt: offer.startsAt?.toISOString() ?? null,
            endsAt: offer.endsAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  async requireActiveByMonths(months: number) {
    const plan = await this.plans.findOne({ where: { months, active: true } });
    if (!plan) {
      throw new BadRequestException('This membership plan is not available.');
    }
    return plan;
  }

  async findByMonths(months: number) {
    return this.plans.findOne({ where: { months } });
  }

  async create(dto: CreateMembershipPlanDto) {
    const months = dto.months;
    if (await this.plans.exists({ where: { months } })) {
      throw new ConflictException(
        `A plan for ${months} months already exists.`,
      );
    }

    const defaults = DEFAULT_MEMBERSHIP_PLANS.find((row) => row.months === months);

    const plan = this.plans.create({
      months,
      name: dto.name.trim(),
      listPricePaise: dto.priceRupees * 100,
      perDayRupees: dto.perDayRupees,
      listPriceUsdCents: defaults?.listPriceUsdCents ?? 0,
      perDayUsdCents: defaults?.perDayUsdCents ?? 0,
      featured: dto.featured ?? false,
      perk: this.normalizePerk(dto.perk),
      active: dto.active ?? true,
      sortOrder: dto.sortOrder ?? months,
    });

    return this.plans.save(plan);
  }

  async update(id: string, dto: UpdateMembershipPlanDto) {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Membership plan not found.');

    if (dto.months != null && dto.months !== plan.months) {
      if (await this.plans.exists({ where: { months: dto.months } })) {
        throw new ConflictException(
          `A plan for ${dto.months} months already exists.`,
        );
      }
      plan.months = dto.months;
    }

    if (dto.name != null) plan.name = dto.name.trim();
    if (dto.priceRupees != null) plan.listPricePaise = dto.priceRupees * 100;
    if (dto.perDayRupees != null) plan.perDayRupees = dto.perDayRupees;
    if (dto.featured != null) plan.featured = dto.featured;
    if (dto.perk !== undefined) plan.perk = this.normalizePerk(dto.perk);
    if (dto.active != null) plan.active = dto.active;
    if (dto.sortOrder != null) plan.sortOrder = dto.sortOrder;

    return this.plans.save(plan);
  }

  async remove(id: string) {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Membership plan not found.');
    await this.plans.remove(plan);
    return { success: true as const };
  }

  toPublic(
    plan: MembershipPlan,
    offer: Awaited<ReturnType<MembershipOffersService['findCurrentOffer']>>,
    region: Region = Region.India,
  ) {
    if (region === Region.OutsideIndia) {
      return {
        id: plan.id,
        months: plan.months,
        name: plan.name,
        listPricePaise: plan.listPriceUsdCents,
        perDayRupees: plan.perDayUsdCents,
        offerPricePaise: null,
        featured: plan.featured,
        perk: plan.perk,
        currency: 'USD' as const,
        offer: null,
      };
    }

    const offerPrice = offer
      ? this.offers.priceForMonths(offer, plan.months)
      : null;

    return {
      id: plan.id,
      months: plan.months,
      name: plan.name,
      listPricePaise: plan.listPricePaise,
      perDayRupees: offerPrice?.offerPerDayRupees ?? plan.perDayRupees,
      offerPricePaise: offerPrice?.offerPricePaise ?? null,
      featured: plan.featured,
      perk: plan.perk,
      currency: 'INR' as const,
      offer: offerPrice
        ? {
            title: offer!.title,
            badge: offer!.badge || offer!.title,
          }
        : null,
    };
  }

  private normalizePerk(perk?: string | null) {
    if (perk == null) return null;
    const trimmed = perk.trim();
    return trimmed.length ? trimmed : null;
  }
}
