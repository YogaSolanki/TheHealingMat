import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Singleton row for site-wide operational settings. */
@Entity({ name: 'site_settings' })
export class SiteSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Live class join URL (Zoom / Meet / streaming). */
  @Column({ type: 'text', nullable: true })
  liveSessionUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
