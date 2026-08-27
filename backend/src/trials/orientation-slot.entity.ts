import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrialCohort } from './trial-cohort.entity';

@Entity({ name: 'orientation_slots' })
export class OrientationSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cohortId: string;

  @ManyToOne(() => TrialCohort, (cohort) => cohort.orientationSlots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cohortId' })
  cohort: TrialCohort;

  @Column()
  label: string;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ default: 50 })
  capacity: number;

  @Column({ default: 0 })
  bookedCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
