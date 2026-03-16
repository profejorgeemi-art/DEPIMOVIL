import { Injectable, Logger } from '@nestjs/common';
import { Reservation } from '../entities/reservation.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  sendReservationConfirmation(reservation: Reservation): void {
    this.logger.log(`Reservation confirmation sent for reservation ID: ${reservation.id}`);
  }

  sendUpdateNotification(reservation: Reservation): void {
    this.logger.log(`Update notification sent for reservation ID: ${reservation.id}`);
  }

  sendCancellationNotification(reservation: Reservation): void {
    this.logger.log(`Cancellation notification sent for reservation ID: ${reservation.id}`);
  }
}
