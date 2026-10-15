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

  /**
   * Corporate proforma / tax invoice payment state.
   * Membership invoices are always issued as paid.
   * Status may change unpaid → paid; invoiceNumber never changes.
   */
  @Column({ type: 'varchar', length: 16, default: 'paid' })
  paymentStatus: 'unpaid' | 'paid';

  /** Set when paymentStatus becomes paid (corporate mark-paid or membership issue). */
  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  /** Corporate purchase-order number shown on the PDF as PO No. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  poNumber: string | null;

  /** Legacy optional PO date — no longer collected or shown. */
  @Column({ type: 'date', nullable: true })
  poDate: string | null;

  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  /** AiSensy WelcomeMembership (welcome_membership) sent after paid purchase. */
  @Column({ type: 'timestamptz', nullable: true })
  membershipWhatsAppSentAt: Date | null;

  /** Membership confirmation email (invoice + permanent session link) sent. */
  @Column({ type: 'timestamptz', nullable: true })
  membershipEmailSentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
