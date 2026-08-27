import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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

  /** bcrypt hash only — never returned in API responses. */
  @Column({ select: false })
  passwordHash: string;

  @Column({ unique: true })
  referralCode: string;

  /** Token used in Personal THM Access Link. */
  @Column({ unique: true })
  accessLinkToken: string;

  /** One Free Trial per user (lifetime). */
  @Column({ default: false })
  hasUsedFreeTrial: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
