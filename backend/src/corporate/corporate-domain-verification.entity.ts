import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Short-lived proof that a member verified a work email for a corporate coupon.
 * Email is NOT written to the user profile.
 */
@Entity({ name: 'corporate_domain_verifications' })
@Index(['userId', 'couponId'])
export class CorporateDomainVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid' })
  couponId: string;

  @Column()
  email: string;

  @Column({ type: 'timestamptz' })
  verifiedAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  /** Set when the coupon is redeemed on a paid membership. */
  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
