import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation } from '../entities/reservation.entity';
import { NotificationService } from '../notification/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  controllers: [ReservationsController],
  providers: [ReservationsService, NotificationService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
