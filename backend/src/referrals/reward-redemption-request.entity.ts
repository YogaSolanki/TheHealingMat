import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type RedemptionStatus = 'pending' | 'fulfilled' | 'rejected';

@Entity({ name: 'reward_redemption_requests' })
export class RewardRedemptionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid' })
  milestoneId: string;

  /** Snapshot of the milestone threshold at request time. */
  @Column({ type: 'int' })
  referralCount: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: RedemptionStatus;

  @Column({ type: 'text', nullable: true })
  adminNote: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
