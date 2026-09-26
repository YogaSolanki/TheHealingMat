import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Admin-configured class start times (e.g. "6:30 AM"). */
@Entity({ name: 'session_timings' })
export class SessionTiming {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Display label used in Class Management and Join matching. */
  @Index({ unique: true })
  @Column({ unique: true })
  label: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
