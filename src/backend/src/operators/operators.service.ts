import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from '../entities/operator.entity';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private readonly operatorsRepository: Repository<Operator>,
  ) {}

  async createOperator(data: CreateOperatorDto): Promise<Operator> {
    if (!data.name || !data.email) {
      throw new BadRequestException('Name and email are required');
    }
    const newOperator = this.operatorsRepository.create(data);
    return this.operatorsRepository.save(newOperator);
  }

  async findAll(): Promise<Operator[]> {
    return this.operatorsRepository.find();
  }

  async getOperator(id: number): Promise<Operator> {
    const operator = await this.operatorsRepository.findOne({ where: { id } });
    if (!operator) {
      throw new NotFoundException('Operator not found');
    }
    return operator;
  }

  async updateOperator(id: number, updateData: UpdateOperatorDto): Promise<Operator> {
    const operator = await this.getOperator(id);
    Object.assign(operator, updateData);
    return this.operatorsRepository.save(operator);
  }

  async deleteOperator(id: number): Promise<void> {
    const result = await this.operatorsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Operator not found');
    }
  }
}
