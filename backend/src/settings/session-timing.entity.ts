import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Admin-configured class start times (e.g. "6:30 AM").
 * Same clock time may exist once for Mon–Sat membership, once for trial,
 * and once for Sunday Q&A.
 */
@Entity({ name: 'session_timings' })
@Index('UQ_session_timings_label_kind', ['label', 'isSundayQa', 'isTrial'], {
  unique: true,
})
export class SessionTiming {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Display label used in Class Management and Join matching. */
  @Column()
  label: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;

  /**
   * Exactly one row is the Mon–Sat Special session slot (fixed card).
   * Cannot also be a Sunday Q&A or trial timing.
   */
  @Column({ type: 'boolean', default: false })
  isSpecial: boolean;

  /**
   * Sunday-only Q&A / Guidance slots. Multiple allowed.
   * Hidden from Mon–Sat Class Management; only shown on Sunday.
   */
  @Column({ type: 'boolean', default: false })
  isSundayQa: boolean;

  /**
   * Mon–Sat trial-only class times. Shown to trial users instead of
   * membership times. Cannot also be Sunday Q&A or Special.
   */
  @Column({ type: 'boolean', default: false })
  isTrial: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
