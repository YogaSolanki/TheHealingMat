import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MembershipOfferPrice } from './membership-offer-price.entity';

@Entity({ name: 'membership_offers' })
export class MembershipOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** e.g. "Diwali Offer" */
  @Column()
  title: string;

  /** Short badge on plan cards, e.g. "Diwali Special" */
  @Column({ default: '' })
  badge: string;

  @Column({ type: 'boolean', default: false })
  active: boolean;

  /** Inclusive start; null = starts immediately when active. */
  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  /** Inclusive end; null = no end date while active. */
  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @OneToMany(() => MembershipOfferPrice, (price) => price.offer, {
    cascade: true,
    eager: true,
  })
  prices: MembershipOfferPrice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
