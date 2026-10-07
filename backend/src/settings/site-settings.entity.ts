import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Singleton row for site-wide operational settings. */
@Entity({ name: 'site_settings' })
export class SiteSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Live class join URL (Zoom / Meet / streaming). */
  @Column({ type: 'text', nullable: true })
  liveSessionUrl: string | null;

  /**
   * Site-wide referral discount for referred members at checkout.
   * Same percent applies to every referral code.
   */
  @Column({ type: 'int', default: 20 })
  referralDiscountPercent: number;

  /**
   * bcrypt hash of the Admin → Settings → Private space gate password.
   * When null, AuthService falls back to ADMIN_PRIVATE_SPACE_PASSWORD env.
   */
  @Column({ type: 'varchar', nullable: true })
  privateSpacePasswordHash: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
