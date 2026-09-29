import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * One row per successful membership checkout that used a coupon.
 * Enforces at most one redemption per user per coupon.
 */
@Entity({ name: 'coupon_redemptions' })
@Index(['couponId', 'userId'], { unique: true })
export class CouponRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  couponId: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  paymentOrderId: string;

  @Column({ type: 'varchar', nullable: true })
  couponCode: string | null;

  /** Work email verified for a corporate coupon (not written to user profile). */
  @Column({ type: 'varchar', nullable: true })
  verifiedEmail: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
