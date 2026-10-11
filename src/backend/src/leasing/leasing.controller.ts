import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { LeasingService } from './leasing.service';

@Controller('leasing')
export class LeasingController {
  constructor(private readonly leasingService: LeasingService) {}

  @Get()
  findAll(@Query('estado') estado?: string) {
    return this.leasingService.findAll(estado);
  }

  @Get('dashboard')
  dashboard() {
    return this.leasingService.dashboard();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leasingService.findOne(+id);
  }

  @Get(':id/cuotas')
  getCuotas(@Param('id') id: string) {
    return this.leasingService.getCuotas(+id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.leasingService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.leasingService.update(+id, dto);
  }

  @Patch(':id/cancelar')
  cancelar(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Body('penalizacion') penalizacion?: number,
  ) {
    return this.leasingService.cancelar(+id, motivo, penalizacion);
  }

  @Patch(':id/completar')
  completar(@Param('id') id: string) {
    return this.leasingService.completar(+id);
  }

  @Patch('cuotas/:cuotaId/pagar')
  pagarCuota(
    @Param('cuotaId') cuotaId: string,
    @Body() dto: { metodo_pago?: string; comprobante?: string },
  ) {
    return this.leasingService.pagarCuota(+cuotaId, dto);
  }
}
