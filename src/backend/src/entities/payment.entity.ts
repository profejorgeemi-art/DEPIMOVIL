import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  operator_id: number;

  @Column()
  reservation_id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column()
  payment_method: string;

  @Column({ nullable: true })
  transaction_id: string;

  @CreateDateColumn()
  created_at: Date;
}