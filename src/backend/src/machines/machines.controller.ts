import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { Machine } from '../entities/machine.entity';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  findAll(): Promise<Machine[]> {
    return this.machinesService.getAllMachines();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Machine> {
    return this.machinesService.getMachineById(+id);
  }

  @Post()
  create(@Body() body: Partial<Machine>): Promise<Machine> {
    return this.machinesService.addMachine(body);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string): Promise<Machine> {
    return this.machinesService.updateMachineStatus(+id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.machinesService.deleteMachine(+id);
  }
}
