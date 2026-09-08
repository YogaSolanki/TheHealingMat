import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'membership_plans' })
export class MembershipPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Plan duration in months (unique catalog key used at checkout). */
  @Index({ unique: true })
  @Column({ type: 'int', unique: true })
  months: number;

  @Column()
  name: string;

  /** List price in paise (₹1 = 100). */
  @Column({ type: 'int' })
  listPricePaise: number;

  /** Marketing “≈ ₹X/day” figure shown on plan cards. */
  @Column({ type: 'int' })
  perDayRupees: number;

  @Column({ type: 'boolean', default: false })
  featured: boolean;

  /** Optional perk callout on the plan card. */
  @Column({ type: 'varchar', nullable: true })
  perk: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
