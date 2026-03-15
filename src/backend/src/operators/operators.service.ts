import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Operator } from './operator.entity';  // Assuming an Operator entity exists
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OperatorService {
    constructor(
        @InjectRepository(Operator)
        private operatorsRepository: Repository<Operator>,
    ) {}

    // Method to create a new operator
    async createOperator(data: CreateOperatorDto): Promise<Operator> {
        try {
            // Validate input data
            if (!data.name || !data.email) {
                throw new BadRequestException('Name and email are required');
            }

            const newOperator = this.operatorsRepository.create(data);
            return await this.operatorsRepository.save(newOperator);
        } catch (error) {
            throw new BadRequestException('Error creating operator: ' + error.message);
        }
    }

    // Method to retrieve an operator by ID
    async getOperator(id: number): Promise<Operator> {
        const operator = await this.operatorsRepository.findOne(id);
        if (!operator) {
            throw new NotFoundException('Operator not found');
        }
        return operator;
    }

    // Method to update an existing operator
    async updateOperator(id: number, updateData: UpdateOperatorDto): Promise<Operator> {
        let operator = await this.getOperator(id);
        // Update operator properties
        Object.assign(operator, updateData);
        return await this.operatorsRepository.save(operator);
    }

    // Method to delete an operator
    async deleteOperator(id: number): Promise<void> {
        const result = await this.operatorsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Operator not found');
        }
    }
}