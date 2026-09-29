import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'corporate_plans' })
export class CorporatePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  companyId: string;

  /** Matches consumer catalog months (3 / 6 / 12). */
  @Column({ type: 'int' })
  planMonths: number;

  @Column()
  planName: string;

  /** Seats purchased — also coupon maxUses. */
  @Column({ type: 'int' })
  employeeCount: number;

  /**
   * Share of list price paid by the company (0–100).
   * Remaining share is what employees pay (via corporate coupon %).
   */
  @Column({ type: 'int' })
  companyPayPercent: number;

  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency: string;

  /** Catalogue list price per seat (minor units). */
  @Column({ type: 'int' })
  listPricePerSeatPaise: number;

  /** listPricePerSeatPaise × employeeCount */
  @Column({ type: 'int' })
  totalListPricePaise: number;

  /** Amount the company pays on this invoice. */
  @Column({ type: 'int' })
  companyAmountPaise: number;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentRef: string | null;

  @Column({ type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ type: 'uuid', nullable: true })
  couponId: string | null;

  @Column({ type: 'uuid', nullable: true })
  invoiceId: string | null;

  @Column({ type: 'varchar', nullable: true })
  invoiceNumber: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'confirmed' })
  status: 'confirmed';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
