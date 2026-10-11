import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EstadoLeasing {
  ACTIVO = 'activo',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  VENCIDO = 'vencido',
}

export enum TipoMaquinaLeasing {
  UNO_EN_UNO = '1en1',
  DOS_EN_UNO = '2en1',
  TRES_EN_UNO = '3en1',
  CUATRO_EN_UNO = '4en1',
}

@Entity('leasing_contracts')
export class LeasingContract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  operadora_id: number;

  @Column()
  operadora_nombre: string;

  @Column()
  maquina_id: number;

  @Column()
  maquina_codigo: string;

  @Column({ type: 'enum', enum: TipoMaquinaLeasing })
  tipo_maquina: TipoMaquinaLeasing;

  @Column({ nullable: true })
  descripcion_maquina: string;

  @Column('decimal', { precision: 10, scale: 2 })
  pago_inicial_usd: number;

  @Column('decimal', { precision: 10, scale: 2 })
  cuota_mensual_uyu: number;

  @Column({ default: 24 })
  plazo_meses: number;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'enum', enum: EstadoLeasing, default: EstadoLeasing.ACTIVO })
  estado: EstadoLeasing;

  @Column({ default: 0 })
  cuotas_pagadas: number;

  @Column({ nullable: true })
  ubicacion_estetica: string;

  @Column({ nullable: true })
  ciudad: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'date', nullable: true })
  fecha_cancelacion: Date;

  @Column({ type: 'text', nullable: true })
  motivo_cancelacion: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  penalizacion_usd: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
