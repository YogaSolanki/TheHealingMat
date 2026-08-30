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

  @Column()
  cohortId: string;

  @ManyToOne(() => TrialCohort, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cohortId' })
  cohort: TrialCohort;

  @Column()
  orientationSlotId: string;

  @ManyToOne(() => OrientationSlot, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orientationSlotId' })
  orientationSlot: OrientationSlot;

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
