import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { InvoiceCategory } from './invoice-category';

/**
 * Per financial-year + category running serial.
 * Locked with SELECT … FOR UPDATE when allocating the next invoice number.
 */
@Entity({ name: 'invoice_sequences' })
export class InvoiceSequence {
  @PrimaryColumn({ type: 'varchar', length: 8 })
  financialYear: string;

  @PrimaryColumn({ type: 'varchar', length: 16 })
  category: InvoiceCategory;

  /** Next serial to issue (1-based). */
  @Column({ type: 'int' })
  nextSerial: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
