import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InvoiceCategory } from './invoice-category';

/**
 * Issued THM commercial invoice (separate from payment gateway refs).
 * Number is immutable once created.
 */
@Entity({ name: 'invoices' })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true, length: 15 })
  invoiceNumber: string;

  /** Source of truth for reporting — do not parse from invoiceNumber. */
  @Index()
  @Column({ type: 'varchar', length: 16 })
  category: InvoiceCategory;

  @Column({ type: 'varchar', length: 8 })
  financialYear: string;

  @Column({ type: 'int' })
  serial: number;

  @Index({ unique: true })
  @Column({ type: 'uuid', nullable: true, unique: true })
  membershipId: string | null;

  /** Corporate plan invoice (CO sequence) — mutually exclusive with membershipId. */
  @Index({ unique: true })
  @Column({ type: 'uuid', nullable: true, unique: true })
  corporatePlanId: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  /** Bill-to display name (member or company). */
  @Column({ type: 'varchar', nullable: true })
  billToName: string | null;

  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency: string;

  @Column({ type: 'int' })
  listPricePaise: number;

  @Column({ type: 'int', default: 0 })
  discountPaise: number;

  @Column({ type: 'int' })
  amountPaidPaise: number;

  @Column({ type: 'varchar', nullable: true })
  paymentReference: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'varchar', nullable: true })
  discountLabel: string | null;

  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  /** AiSensy app_membership_confirm sent after paid membership purchase. */
  @Column({ type: 'timestamptz', nullable: true })
  membershipWhatsAppSentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
