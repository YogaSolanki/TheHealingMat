import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CouponDiscountType = 'percent' | 'fixed';

@Entity({ name: 'coupons' })
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  code: string;

  /** Display / generation label (often the assignee name once assigned). */
  @Column()
  userName: string;

  /**
   * Member this coupon is locked to.
   * null = open code anyone can redeem (up to maxUses).
   */
  @Column({ type: 'uuid', nullable: true })
  assignedUserId: string | null;

  /** Snapshot of the assignee's referral code for admin display. */
  @Column({ type: 'varchar', nullable: true })
  assignedReferralCode: string | null;

  /** percent = % off, fixed = flat amount off (e.g. ₹) */
  @Column({ type: 'varchar', length: 20, default: 'fixed' })
  discountType: CouponDiscountType;

  @Column({ type: 'int', default: 0 })
  discountValue: number;

  /** Human label, e.g. "100 OFF" or "50% OFF" */
  @Column({ default: '' })
  discountLabel: string;

  /** Total redemptions allowed across all members (e.g. 1 or 10). */
  @Column({ type: 'int', default: 1 })
  maxUses: number;

  /** Successful checkouts that used this coupon. */
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  /** Soft disable without deleting history. */
  @Column({ default: true })
  active: boolean;

  /** Optional time expiry (UTC). */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
