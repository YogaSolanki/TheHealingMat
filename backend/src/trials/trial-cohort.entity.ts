import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrientationSlot } from './orientation-slot.entity';

@Entity({ name: 'trial_cohorts' })
export class TrialCohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;

  /** Cohort start (trial active from this date). */
  @Column({ type: 'timestamptz' })
  startsAt: Date;

  /** Cohort end (14 days after start). */
  @Column({ type: 'timestamptz' })
  endsAt: Date;

  /** When this cohort becomes bookable in registration. */
  @Column({ type: 'timestamptz' })
  registrationOpensAt: Date;

  @Column({ default: true })
  isOpen: boolean;

  @OneToMany(() => OrientationSlot, (slot) => slot.cohort)
  orientationSlots: OrientationSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
