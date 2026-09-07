import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MembershipStatus = 'active' | 'scheduled' | 'expired';

@Entity({ name: 'memberships' })
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'int' })
  planMonths: number;

  @Column()
  planName: string;

  @Column({ type: 'int' })
  listPricePaise: number;

  @Column({ type: 'int', default: 0 })
  discountPaise: number;

  @Column({ type: 'int' })
  amountPaidPaise: number;

  @Column({ type: 'varchar' })
  status: MembershipStatus;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column()
  paymentOrderId: string;

  @Column({ type: 'varchar', nullable: true })
  razorpayPaymentId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
