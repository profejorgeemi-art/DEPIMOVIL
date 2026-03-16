import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  @IsNumber()
  operator_id: number;

  @ApiProperty()
  @IsNumber()
  reservation_id: number;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  payment_method: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transaction_id?: string;
}
