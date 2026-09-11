import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'corporate_enquiries' })
export class CorporateEnquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  company: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ default: '' })
  employees: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  emailed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
