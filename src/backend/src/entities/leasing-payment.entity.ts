import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum EstadoCuotaLeasing {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada',
  VENCIDA = 'vencida',
}

@Entity('leasing_payments')
export class LeasingPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leasing_id: number;

  @Column()
  numero_cuota: number;

  @Column('decimal', { precision: 10, scale: 2 })
  monto_uyu: number;

  @Column({ type: 'date' })
  fecha_vencimiento: Date;

  @Column({ type: 'date', nullable: true })
  fecha_pago: Date;

  @Column({ type: 'enum', enum: EstadoCuotaLeasing, default: EstadoCuotaLeasing.PENDIENTE })
  estado: EstadoCuotaLeasing;

  @Column({ nullable: true })
  metodo_pago: string;

  @Column({ nullable: true })
  comprobante: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  created_at: Date;
}
