import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeasingContract, EstadoLeasing } from '../entities/leasing.entity';
import { LeasingPayment, EstadoCuotaLeasing } from '../entities/leasing-payment.entity';

@Injectable()
export class LeasingService {
  constructor(
    @InjectRepository(LeasingContract)
    private leasingRepo: Repository<LeasingContract>,
    @InjectRepository(LeasingPayment)
    private paymentRepo: Repository<LeasingPayment>,
  ) {}

  async findAll(estado?: string): Promise<LeasingContract[]> {
    const query = this.leasingRepo.createQueryBuilder('l');
    if (estado) query.andWhere('l.estado = :estado', { estado });
    return query.orderBy('l.created_at', 'DESC').getMany();
  }

  async findOne(id: number): Promise<LeasingContract> {
    const contract = await this.leasingRepo.findOne({ where: { id } });
    if (!contract) throw new NotFoundException(`Contrato de leasing #${id} no encontrado`);
    return contract;
  }

  async create(dto: Partial<LeasingContract>): Promise<LeasingContract> {
    if (!dto.operadora_id || !dto.maquina_id || !dto.tipo_maquina) {
      throw new BadRequestException('operadora_id, maquina_id y tipo_maquina son obligatorios');
    }
    if (!dto.pago_inicial_usd || !dto.cuota_mensual_uyu) {
      throw new BadRequestException('pago_inicial_usd y cuota_mensual_uyu son obligatorios');
    }
    if (!dto.fecha_inicio) {
      throw new BadRequestException('fecha_inicio es obligatorio');
    }

    const plazo = dto.plazo_meses || 24;
    const inicio = new Date(dto.fecha_inicio);
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + plazo);
    dto.fecha_fin = fin;
    dto.plazo_meses = plazo;

    if (!dto.codigo) {
      const count = await this.leasingRepo.count();
      dto.codigo = 'LEA-' + String(count + 1).padStart(3, '0');
    }

    const contract = this.leasingRepo.create(dto);
    const saved = await this.leasingRepo.save(contract);

    await this.generarCuotas(saved);

    return saved;
  }

  async update(id: number, dto: Partial<LeasingContract>): Promise<LeasingContract> {
    const contract = await this.findOne(id);
    Object.assign(contract, dto);
    return this.leasingRepo.save(contract);
  }

  async cancelar(id: number, motivo: string, penalizacion?: number): Promise<LeasingContract> {
    const contract = await this.findOne(id);
    if (contract.estado !== EstadoLeasing.ACTIVO) {
      throw new BadRequestException('Solo se pueden cancelar contratos activos');
    }
    contract.estado = EstadoLeasing.CANCELADO;
    contract.fecha_cancelacion = new Date();
    contract.motivo_cancelacion = motivo;
    if (penalizacion !== undefined) contract.penalizacion_usd = penalizacion;
    return this.leasingRepo.save(contract);
  }

  async completar(id: number): Promise<LeasingContract> {
    const contract = await this.findOne(id);
    contract.estado = EstadoLeasing.COMPLETADO;
    return this.leasingRepo.save(contract);
  }

  private async generarCuotas(contract: LeasingContract): Promise<void> {
    const cuotas: Partial<LeasingPayment>[] = [];
    const inicio = new Date(contract.fecha_inicio);

    for (let i = 1; i <= contract.plazo_meses; i++) {
      const vencimiento = new Date(inicio);
      vencimiento.setMonth(vencimiento.getMonth() + i);
      cuotas.push({
        leasing_id: contract.id,
        numero_cuota: i,
        monto_uyu: contract.cuota_mensual_uyu,
        fecha_vencimiento: vencimiento,
        estado: EstadoCuotaLeasing.PENDIENTE,
      });
    }

    await this.paymentRepo.save(cuotas.map(c => this.paymentRepo.create(c)));
  }

  async getCuotas(leasingId: number): Promise<LeasingPayment[]> {
    return this.paymentRepo.find({
      where: { leasing_id: leasingId },
      order: { numero_cuota: 'ASC' },
    });
  }

  async pagarCuota(cuotaId: number, dto: { metodo_pago?: string; comprobante?: string }): Promise<LeasingPayment> {
    const cuota = await this.paymentRepo.findOne({ where: { id: cuotaId } });
    if (!cuota) throw new NotFoundException(`Cuota #${cuotaId} no encontrada`);
    if (cuota.estado === EstadoCuotaLeasing.PAGADA) {
      throw new BadRequestException('Esta cuota ya fue pagada');
    }

    cuota.estado = EstadoCuotaLeasing.PAGADA;
    cuota.fecha_pago = new Date();
    if (dto.metodo_pago) cuota.metodo_pago = dto.metodo_pago;
    if (dto.comprobante) cuota.comprobante = dto.comprobante;
    await this.paymentRepo.save(cuota);

    const contract = await this.findOne(cuota.leasing_id);
    contract.cuotas_pagadas = (contract.cuotas_pagadas || 0) + 1;
    await this.leasingRepo.save(contract);

    if (contract.cuotas_pagadas >= contract.plazo_meses) {
      await this.completar(contract.id);
    }

    return cuota;
  }

  async dashboard(): Promise<{
    activos: number;
    completados: number;
    cancelados: number;
    cuotas_pendientes: number;
    cuotas_vencidas: number;
    ingresos_cuotas_uyu: number;
    ingresos_iniciales_usd: number;
    proximos_vencimientos: LeasingPayment[];
  }> {
    const contratos = await this.leasingRepo.find();
    const activos = contratos.filter(c => c.estado === EstadoLeasing.ACTIVO).length;
    const completados = contratos.filter(c => c.estado === EstadoLeasing.COMPLETADO).length;
    const cancelados = contratos.filter(c => c.estado === EstadoLeasing.CANCELADO).length;

    const activoIds = contratos.filter(c => c.estado === EstadoLeasing.ACTIVO).map(c => c.id);
    let cuotasPendientes = 0;
    let cuotasVencidas = 0;
    let ingresosCuotas = 0;
    let ingresosIniciales = 0;
    let proxVenc: LeasingPayment[] = [];

    if (activoIds.length) {
      const cuotas = await this.paymentRepo
        .createQueryBuilder('p')
        .where('p.leasing_id IN (:...ids)', { ids: activoIds })
        .getMany();

      const hoy = new Date().toISOString().slice(0, 10);
      cuotasPendientes = cuotas.filter(c => c.estado === EstadoCuotaLeasing.PENDIENTE).length;
      cuotasVencidas = cuotas.filter(c => c.estado === EstadoCuotaLeasing.PENDIENTE && c.fecha_vencimiento.toString().slice(0, 10) < hoy).length;
      ingresosCuotas = cuotas.filter(c => c.estado === EstadoCuotaLeasing.PAGADA).reduce((s, c) => s + Number(c.monto_uyu), 0);

      proxVenc = cuotas
        .filter(c => c.estado === EstadoCuotaLeasing.PENDIENTE && c.fecha_vencimiento.toString().slice(0, 10) >= hoy)
        .sort((a, b) => a.fecha_vencimiento.toString().localeCompare(b.fecha_vencimiento.toString()))
        .slice(0, 10);
    }

    ingresosIniciales = contratos.reduce((s, c) => s + Number(c.pago_inicial_usd), 0);

    return {
      activos,
      completados,
      cancelados,
      cuotas_pendientes: cuotasPendientes,
      cuotas_vencidas: cuotasVencidas,
      ingresos_cuotas_uyu: ingresosCuotas,
      ingresos_iniciales_usd: ingresosIniciales,
      proximos_vencimientos: proxVenc,
    };
  }
}
