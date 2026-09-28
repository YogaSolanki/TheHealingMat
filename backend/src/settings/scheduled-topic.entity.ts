import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** One special-session topic for a specific calendar date. */
@Entity({ name: 'scheduled_topics' })
@Index(['topicDate'], { unique: true })
export class ScheduledTopic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Calendar date (YYYY-MM-DD). */
  @Column({ type: 'date' })
  topicDate: string;

  /** Weekday label derived from topicDate (e.g. "Monday"). */
  @Column()
  dayLabel: string;

  @Column({ type: 'varchar', length: 200 })
  topic: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
