import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'orientation_videos' })
export class OrientationVideo {
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

  @Column({ default: 'Orientation' })
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
