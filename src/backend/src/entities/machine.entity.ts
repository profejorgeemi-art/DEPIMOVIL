import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UsoOperativo {
  VIAJERA = 'viajera',
  BASE_CIUDAD = 'base_ciudad',
  SOLO_VENTA = 'solo_venta',
}

export enum EstadoMaquina {
  DISPONIBLE = 'disponible',
  RESERVADA = 'reservada',
  MANTENIMIENTO = 'mantenimiento',
  FUERA_SERVICIO = 'fuera_servicio',
  EN_VIAJE = 'en_viaje',
}

@Entity('machines')
export class Machine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo_interno: string;

  @Column()
  nombre_comercial: string;

  @Column()
  category: string;

  @Column({ type: 'enum', enum: UsoOperativo, default: UsoOperativo.BASE_CIUDAD })
  uso_operativo: UsoOperativo;

  @Column({ nullable: true })
  ciudad_base: string;

  @Column({ nullable: true })
  ubicacion_actual: string;

  @Column({ type: 'enum', enum: EstadoMaquina, default: EstadoMaquina.DISPONIBLE })
  estado: EstadoMaquina;

  @Column({ nullable: true })
  marca: string;

  @Column({ nullable: true })
  modelo_tipo: string;

  @Column({ default: 'Uruguay' })
  pais_base: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  serial_number: string;

  @Column({ nullable: true })
  icono_url: string;

  @Column({ nullable: true })
  foto_url: string;

  @Column({ type: 'text', nullable: true })
  observaciones_tecnicas: string;

  @Column({ type: 'date', nullable: true })
  ultimo_mantenimiento: Date;

  @Column({ type: 'date', nullable: true })
  proximo_mantenimiento: Date;

  @Column('text', { array: true, default: '{}' })
  ciudades_restringidas: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  get esViajera(): boolean {
    return this.uso_operativo === UsoOperativo.VIAJERA;
  }

  get estaDisponible(): boolean {
    return this.estado === EstadoMaquina.DISPONIBLE;
  }

  puedeOfrecerseEn(ciudad: string): boolean {
    if (this.uso_operativo === UsoOperativo.BASE_CIUDAD) {
      return this.ciudad_base?.toUpperCase() === ciudad.toUpperCase();
    }
    if (this.uso_operativo === UsoOperativo.VIAJERA) {
      return !this.ciudades_restringidas
        .map(c => c.toUpperCase())
        .includes(ciudad.toUpperCase());
    }
    return false;
  }
}
