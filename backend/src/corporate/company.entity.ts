import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  companyName: string;

  /**
   * Allowed email domains for corporate coupon verification
   * (e.g. ["nexi.com", "masterunion.org"]).
   */
  @Column({ type: 'simple-json', default: '[]' })
  domains: string[];

  @Column({ type: 'varchar', nullable: true })
  gstNumber: string | null;

  /** Billing state / location for invoices. */
  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ type: 'varchar', nullable: true })
  billingEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  billingPhone: string | null;

  @Column({ type: 'varchar', nullable: true })
  billingAddress: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
