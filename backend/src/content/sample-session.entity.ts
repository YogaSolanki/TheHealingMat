import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Recorded sample sessions shown to waiting trial members. */
@Entity({ name: 'sample_sessions' })
export class SampleSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column()
  subtitle: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'Sample Session' })
  category: string;

  @Column({ default: '' })
  duration: string;

  @Column({ type: 'text', default: '' })
  coverUrl: string;

  @Column({ type: 'text', nullable: true })
  videoUrl: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
