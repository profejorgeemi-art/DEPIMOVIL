import { IsNumber, IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty()
  @IsNumber()
  operator_id: number;

  @ApiProperty()
  @IsNumber()
  machine_id: number;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
