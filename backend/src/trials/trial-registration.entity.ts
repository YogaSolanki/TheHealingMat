import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { TrialStatus } from '../users/enums/trial-status.enum';
import { OrientationSlot } from './orientation-slot.entity';
import { TrialCohort } from './trial-cohort.entity';

@Entity({ name: 'trial_registrations' })
export class TrialRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Legacy cohort booking; null for signup-day 14-day trials. */
  @Column({ type: 'uuid', nullable: true })
  cohortId: string | null;

  @ManyToOne(() => TrialCohort, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cohortId' })
  cohort: TrialCohort | null;

  /** Legacy orientation booking; null for signup-day 14-day trials. */
  @Column({ type: 'uuid', nullable: true })
  orientationSlotId: string | null;

  @ManyToOne(() => OrientationSlot, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'orientationSlotId' })
  orientationSlot: OrientationSlot | null;

  @Column({ type: 'varchar', default: TrialStatus.Scheduled })
  status: TrialStatus;

  @Column({ type: 'timestamptz' })
  trialStartsAt: Date;

  @Column({ type: 'timestamptz' })
  trialEndsAt: Date;

  @CreateDateColumn()
  registeredAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
