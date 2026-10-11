import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeasingContract } from '../entities/leasing.entity';
import { LeasingPayment } from '../entities/leasing-payment.entity';
import { LeasingService } from './leasing.service';
import { LeasingController } from './leasing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeasingContract, LeasingPayment])],
  controllers: [LeasingController],
  providers: [LeasingService],
  exports: [LeasingService],
})
export class LeasingModule {}
