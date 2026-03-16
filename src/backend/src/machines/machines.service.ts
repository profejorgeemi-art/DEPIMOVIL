import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from '../entities/machine.entity';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private readonly machinesRepository: Repository<Machine>,
  ) {}

  getAllMachines(): Promise<Machine[]> {
    return this.machinesRepository.find();
  }

  async getMachineById(id: number): Promise<Machine> {
    const machine = await this.machinesRepository.findOne({ where: { id } });
    if (!machine) {
      throw new NotFoundException('Machine not found');
    }
    return machine;
  }

  addMachine(data: Partial<Machine>): Promise<Machine> {
    const machine = this.machinesRepository.create(data);
    return this.machinesRepository.save(machine);
  }

  async updateMachineStatus(id: number, status: string): Promise<Machine> {
    const machine = await this.getMachineById(id);
    machine.status = status;
    return this.machinesRepository.save(machine);
  }

  async updateMachineLocation(id: number, location: string): Promise<Machine> {
    const machine = await this.getMachineById(id);
    machine.location = location;
    return this.machinesRepository.save(machine);
  }

  async validateMachineAvailability(id: number): Promise<boolean> {
    const machine = await this.machinesRepository.findOne({ where: { id } });
    return machine ? machine.status === 'Available' : false;
  }

  async deleteMachine(id: number): Promise<void> {
    const result = await this.machinesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Machine not found');
    }
  }
}
