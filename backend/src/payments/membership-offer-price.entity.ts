import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MembershipOffer } from './membership-offer.entity';

@Entity({ name: 'membership_offer_prices' })
@Unique(['offerId', 'months'])
export class MembershipOfferPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  offerId: string;

  @ManyToOne(() => MembershipOffer, (offer) => offer.prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'offerId' })
  offer: MembershipOffer;

  @Column({ type: 'int' })
  months: number;

  @Column({ type: 'int' })
  offerPricePaise: number;

  @Column({ type: 'int' })
  offerPerDayRupees: number;
}
