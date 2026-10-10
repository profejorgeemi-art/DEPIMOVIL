import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { EstadoMaquina } from '../entities/machine.entity';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  create(@Body() createMachineDto: any) {
    return this.machinesService.create(createMachineDto);
  }

  @Get()
  findAll(@Query('ciudad') ciudad?: string, @Query('estado') estado?: string) {
    return this.machinesService.findAll(ciudad, estado);
  }

  @Get('disponibles/:ciudad')
  disponiblesEnCiudad(@Param('ciudad') ciudad: string) {
    return this.machinesService.disponiblesParaAlquilar(ciudad);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machinesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMachineDto: any) {
    return this.machinesService.update(+id, updateMachineDto);
  }

  @Patch(':id/convertir-a-base')
  convertirABase(
    @Param('id') id: string,
    @Body('ciudad') ciudad: string,
  ) {
    return this.machinesService.convertirViajeroABase(+id, ciudad);
  }

  @Patch(':id/convertir-a-viajera')
  convertirAViajera(
    @Param('id') id: string,
    @Body('ciudades_restringidas') ciudadesRestringidas: string[],
  ) {
    return this.machinesService.convertirBaseAViajera(+id, ciudadesRestringidas);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id') id: string,
    @Body('estado') estado: EstadoMaquina,
  ) {
    return this.machinesService.cambiarEstado(+id, estado);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.machinesService.remove(+id);
  }
}
