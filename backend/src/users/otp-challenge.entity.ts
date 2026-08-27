import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Region } from './enums/region.enum';

export type OtpChannel = 'sms' | 'email';
export type OtpPurpose = 'login' | 'signup';

@Entity({ name: 'otp_challenges' })
export class OtpChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  region: Region;

  @Column({ type: 'varchar' })
  channel: OtpChannel;

  @Column()
  destination: string;

  @Column({ type: 'varchar' })
  purpose: OtpPurpose;

  @Column()
  codeHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ default: 0 })
  attempts: number;

  @CreateDateColumn()
  createdAt: Date;
}
