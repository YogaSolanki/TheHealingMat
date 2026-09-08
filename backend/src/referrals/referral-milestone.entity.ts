import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'referral_milestones' })
export class ReferralMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Successful paid referrals required to unlock this reward. */
  @Index({ unique: true })
  @Column({ type: 'int' })
  referralCount: number;

  @Column()
  rewardTitle: string;

  @Column({ type: 'text', default: '' })
  rewardDescription: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
