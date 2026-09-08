import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentOrderStatus = 'created' | 'paid' | 'failed';
export type MembershipStartMode = 'now' | 'after_current';

@Entity({ name: 'payment_orders' })
export class PaymentOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Index({ unique: true })
  @Column({ unique: true })
  razorpayOrderId: string;

  @Column({ type: 'varchar', nullable: true })
  razorpayPaymentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  razorpayInvoiceId: string | null;

  @Column({ type: 'varchar', nullable: true })
  razorpayInvoiceUrl: string | null;

  @Column({ type: 'int' })
  amountPaise: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column()
  receipt: string;

  @Column({ type: 'int', nullable: true })
  planMonths: number | null;

  @Column({ type: 'varchar', nullable: true })
  couponCode: string | null;

  @Column({ type: 'varchar', default: 'now' })
  startMode: MembershipStartMode;

  @Column({ type: 'int', default: 0 })
  listPricePaise: number;

  @Column({ type: 'int', default: 0 })
  discountPaise: number;

  @Column({ type: 'varchar', default: 'created' })
  status: PaymentOrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
