import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CreateMembershipOfferDto,
  MembershipOfferPriceDto,
  UpdateMembershipOfferDto,
} from './dto/membership-offer.dto';
import { MembershipOfferPrice } from './membership-offer-price.entity';
import { MembershipOffer } from './membership-offer.entity';
import { MembershipPlan } from './membership-plan.entity';

@Injectable()
export class MembershipOffersService {
  constructor(
    @InjectRepository(MembershipOffer)
    private readonly offers: Repository<MembershipOffer>,
    @InjectRepository(MembershipOfferPrice)
    private readonly offerPrices: Repository<MembershipOfferPrice>,
    @InjectRepository(MembershipPlan)
    private readonly plans: Repository<MembershipPlan>,
  ) {}

  listAdmin() {
    return this.offers.find({
      order: { updatedAt: 'DESC' },
      relations: { prices: true },
    });
  }

  /** The single promo currently live for the storefront (if any). */
  async findCurrentOffer(now = new Date()) {
    const candidates = await this.offers.find({
      where: { active: true },
      order: { updatedAt: 'DESC' },
      relations: { prices: true },
    });

    return (
      candidates.find((offer) => this.isOfferLive(offer, now)) ?? null
    );
  }

  async create(dto: CreateMembershipOfferDto) {
    const prices = await this.normalizePrices(dto.prices);
    this.assertDateRange(dto.startsAt, dto.endsAt);

    if (dto.active) {
      await this.deactivateAll();
    }

    const offer = this.offers.create({
      title: dto.title.trim(),
      badge: (dto.badge ?? dto.title).trim(),
      active: dto.active ?? false,
      startsAt: this.parseDate(dto.startsAt),
      endsAt: this.parseDate(dto.endsAt),
      prices: prices.map((row) => this.offerPrices.create(row)),
    });

    return this.offers.save(offer);
  }

  async update(id: string, dto: UpdateMembershipOfferDto) {
    const offer = await this.offers.findOne({
      where: { id },
      relations: { prices: true },
    });
    if (!offer) throw new NotFoundException('Offer not found.');

    if (dto.title != null) offer.title = dto.title.trim();
    if (dto.badge != null) offer.badge = dto.badge.trim();
    if (dto.startsAt !== undefined) offer.startsAt = this.parseDate(dto.startsAt);
    if (dto.endsAt !== undefined) offer.endsAt = this.parseDate(dto.endsAt);
    this.assertDateRange(
      offer.startsAt?.toISOString() ?? null,
      offer.endsAt?.toISOString() ?? null,
    );

    if (dto.active != null) {
      if (dto.active) await this.deactivateAll(id);
      offer.active = dto.active;
    }

    if (dto.prices) {
      const next = await this.normalizePrices(dto.prices);
      await this.offerPrices.delete({ offerId: id });
      offer.prices = next.map((row) =>
        this.offerPrices.create({ ...row, offerId: id }),
      );
    }

    return this.offers.save(offer);
  }

  async remove(id: string) {
    const offer = await this.offers.findOne({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found.');
    await this.offers.remove(offer);
    return { success: true as const };
  }

  isOfferLive(offer: MembershipOffer, now = new Date()) {
    if (!offer.active) return false;
    if (offer.startsAt && offer.startsAt.getTime() > now.getTime()) return false;
    if (offer.endsAt && offer.endsAt.getTime() < now.getTime()) return false;
    return true;
  }

  priceForMonths(offer: MembershipOffer, months: number) {
    return offer.prices?.find((row) => row.months === months) ?? null;
  }

  private async normalizePrices(rows: MembershipOfferPriceDto[]) {
    const months = rows.map((row) => row.months);
    const unique = new Set(months);
    if (unique.size !== months.length) {
      throw new BadRequestException('Duplicate plan months in offer prices.');
    }

    const plans = await this.plans.find({
      where: { months: In(months), active: true },
    });
    if (plans.length !== months.length) {
      throw new BadRequestException(
        'Offer prices must match existing membership plans.',
      );
    }

    return rows.map((row) => ({
      months: row.months,
      offerPricePaise: row.priceRupees * 100,
      offerPerDayRupees: row.perDayRupees,
    }));
  }

  private async deactivateAll(exceptId?: string) {
    const active = await this.offers.find({ where: { active: true } });
    for (const offer of active) {
      if (exceptId && offer.id === exceptId) continue;
      offer.active = false;
    }
    if (active.length) await this.offers.save(active);
  }

  private parseDate(value?: string | null) {
    if (value == null || value === '') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid offer date.');
    }
    return date;
  }

  private assertDateRange(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt || !endsAt) return;
    if (new Date(startsAt).getTime() > new Date(endsAt).getTime()) {
      throw new BadRequestException('Offer start date must be before end date.');
    }
  }
}
