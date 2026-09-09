import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Region } from './enums/region.enum';
import { Gender } from './enums/gender.enum';

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

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', nullable: true })
  gender: Gender | null;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
