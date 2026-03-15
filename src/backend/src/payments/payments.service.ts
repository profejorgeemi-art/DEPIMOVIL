import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './repositories/payment.repository';
import { UserRepository } from './repositories/user.repository';
import { DebtRepository } from './repositories/debt.repository';
import { PaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly userRepository: UserRepository,
    private readonly debtRepository: DebtRepository,
  ) {}

  async addPayment(userId: string, paymentDto: PaymentDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const canPay = await this.validateFinancialStatus(userId, paymentDto.amount);
    
    if (!canPay) {
      throw new Error('Insufficient funds or debts');
    }

    await this.paymentRepository.create({ userId, ...paymentDto });
    await this.debtRepository.adjustDebt(userId, -paymentDto.amount);
  }

  async getPaymentHistory(userId: string): Promise<any[]> {
    const payments = await this.paymentRepository.findByUserId(userId);
    return payments;
  }

  async handleProof(userId: string, paymentId: string, proof: any): Promise<void> {
    const payment = await this.paymentRepository.findById(paymentId);
    
    if (!payment || payment.userId !== userId) {
      throw new Error('Payment or user not found');
    }

    payment.proof = proof;
    await this.paymentRepository.update(paymentId, payment);
  }

  async validateFinancialStatus(userId: string, amount: number): Promise<boolean> {
    const totalDebt = await this.debtRepository.getTotalDebt(userId);
    const userFunds = await this.userRepository.getFunds(userId);

    return userFunds >= amount && totalDebt <= userFunds;
  }
}