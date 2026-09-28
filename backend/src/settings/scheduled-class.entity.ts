import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SessionTiming } from './session-timing.entity';

/** One scheduled live class for a specific date + session time. */
@Entity({ name: 'scheduled_classes' })
@Index(['classDate', 'sessionTimingId'], { unique: true })
export class ScheduledClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Calendar date (YYYY-MM-DD). */
  @Column({ type: 'date' })
  classDate: string;

  /** Weekday label derived from classDate (e.g. "Monday"). */
  @Column()
  dayLabel: string;

  @Column({ type: 'uuid' })
  sessionTimingId: string;

  @ManyToOne(() => SessionTiming, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sessionTimingId' })
  sessionTiming: SessionTiming;

  /** Snapshot of timing label at schedule time (stable if timing is renamed later). */
  @Column()
  sessionTimeLabel: string;

  /** Zoom / Meet / streaming URL for this class. */
  @Column({ type: 'text' })
  meetingUrl: string;

  /**
   * When true on Mon–Sat: Special Session (topics block).
   * When true on Sunday: Q&A & Guidance session.
   */
  @Column({ type: 'boolean', default: false })
  isSpecial: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
