import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'resource_guides' })
export class ResourceGuide {
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

  @Column()
  category: string;

  @Column({ default: '' })
  pages: string;

  @Column({ type: 'text', default: '' })
  coverUrl: string;

  @Column({ type: 'text', nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
