import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountStatus } from './enums/account-status.enum';
import { Region } from './enums/region.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Permanent account role for JWT / RolesGuard. */
  @Column({ default: 'user' })
  role: string;

  @Column({ type: 'varchar' })
  region: Region;

  @Column({ type: 'varchar', nullable: true, unique: true })
  mobile: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  email: string | null;

  @Column()
  fullName: string;

  /** Residence: Indian state, or country when region is outside India. */
  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  /**
   * Reward delivery contact — separate from account email.
   * Used only to autofill the Milestones & Rewards redeem popup.
   */
  @Column({ type: 'varchar', nullable: true })
  deliveryEmail: string | null;

  /**
   * Reward delivery address — not shown on My Account personal info.
   * Used only to autofill the Milestones & Rewards redeem popup.
   */
  @Column({ type: 'text', nullable: true })
  deliveryAddress: string | null;

  /** Preferred daily class time slot label (e.g. "6:30 AM"). */
  @Column({ type: 'varchar', nullable: true })
  preferredClassTime: string | null;

  /** bcrypt hash only - never returned in API responses. */
  @Column({ select: false })
  passwordHash: string;

  /** True once the member has chosen their own password (not auto-generated). */
  @Column({ default: false })
  passwordSetByUser: boolean;

  @Column({ unique: true })
  referralCode: string;

  /**
   * Permanent Personal THM Access Link slug (`/u/{slug}`).
   * Assigned once at registration and never changed if the name is edited.
   */
  @Column({ unique: true })
  accessLinkToken: string;

  /** Referring member, if this account signed up with a referral code. */
  @Column({ type: 'uuid', nullable: true })
  referredByUserId: string | null;

  /** One Free Trial per user (lifetime). */
  @Column({ default: false })
  hasUsedFreeTrial: boolean;

  /** inactive = deactivated by admin; login blocked, records retained. */
  @Column({ type: 'varchar', default: AccountStatus.Active })
  accountStatus: AccountStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
