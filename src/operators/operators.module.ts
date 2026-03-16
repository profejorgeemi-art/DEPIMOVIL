import { Module } from '@nestjs/common';
import { OperatorsService } from './operators.service';
@Module({
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}