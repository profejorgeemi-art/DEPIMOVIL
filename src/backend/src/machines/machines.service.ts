import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine, UsoOperativo, EstadoMaquina } from '../entities/machine.entity';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private machinesRepository: Repository<Machine>,
  ) {}

  async findAll(ciudad?: string, estado?: string): Promise<Machine[]> {
    const query = this.machinesRepository.createQueryBuilder('machine');

    if (estado) {
      query.andWhere('machine.estado = :estado', { estado });
    }

    if (ciudad) {
      query.andWhere(
        '(machine.uso_operativo = :base AND UPPER(machine.ciudad_base) = UPPER(:ciudad))' +
        ' OR ' +
        '(machine.uso_operativo = :viajera AND NOT (UPPER(:ciudad) = ANY(SELECT UPPER(unnest(machine.ciudades_restringidas)))))',
        {
          base: UsoOperativo.BASE_CIUDAD,
          viajera: UsoOperativo.VIAJERA,
          ciudad,
        },
      );
    }

    return query.orderBy('machine.codigo_interno', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Machine> {
    const machine = await this.machinesRepository.findOne({ where: { id } });
    if (!machine) throw new NotFoundException(`Máquina #${id} no encontrada`);
    return machine;
  }

  async create(dto: Partial<Machine>): Promise<Machine> {
    const machine = this.machinesRepository.create(dto);
    return this.machinesRepository.save(machine);
  }

  async update(id: number, dto: Partial<Machine>): Promise<Machine> {
    const machine = await this.findOne(id);
    Object.assign(machine, dto);
    return this.machinesRepository.save(machine);
  }

  async remove(id: number): Promise<void> {
    await this.machinesRepository.delete(id);
  }

  /**
   * Cambia una máquina viajera a base fija en una ciudad.
   * Caso de uso: máquina chica viajera que se asigna fija a Maldonado
   * para estéticas con escalera o ciudades cercanas.
   */
  async convertirViajeroABase(id: number, ciudadDestino: string): Promise<Machine> {
    const machine = await this.findOne(id);

    if (machine.uso_operativo !== UsoOperativo.VIAJERA) {
      throw new BadRequestException(
        `La máquina ${machine.codigo_interno} no es viajera, es ${machine.uso_operativo}`,
      );
    }

    machine.uso_operativo = UsoOperativo.BASE_CIUDAD;
    machine.ciudad_base = ciudadDestino.toUpperCase();
    machine.ubicacion_actual = ciudadDestino.toUpperCase();
    machine.ciudades_restringidas = [];

    return this.machinesRepository.save(machine);
  }

  /**
   * Cambia una máquina de base fija a viajera.
   * La máquina deja de estar asignada a una ciudad y pasa a circular,
   * con restricciones opcionales.
   */
  async convertirBaseAViajera(
    id: number,
    ciudadesRestringidas: string[] = [],
  ): Promise<Machine> {
    const machine = await this.findOne(id);

    if (machine.uso_operativo !== UsoOperativo.BASE_CIUDAD) {
      throw new BadRequestException(
        `La máquina ${machine.codigo_interno} no es de base, es ${machine.uso_operativo}`,
      );
    }

    machine.uso_operativo = UsoOperativo.VIAJERA;
    machine.ciudad_base = null;
    machine.ciudades_restringidas = ciudadesRestringidas.map(c => c.toUpperCase());

    return this.machinesRepository.save(machine);
  }

  async cambiarEstado(id: number, nuevoEstado: EstadoMaquina): Promise<Machine> {
    const machine = await this.findOne(id);
    machine.estado = nuevoEstado;
    return this.machinesRepository.save(machine);
  }

  /**
   * Devuelve las máquinas disponibles para alquilar en una ciudad,
   * excluyendo viajeras restringidas en esa ciudad.
   */
  async disponiblesParaAlquilar(ciudad: string): Promise<Machine[]> {
    return this.findAll(ciudad, EstadoMaquina.DISPONIBLE);
  }
}
