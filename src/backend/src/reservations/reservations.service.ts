import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const reservation = this.reservationsRepository.create(createReservationDto);
    const saved = await this.reservationsRepository.save(reservation);
    this.notificationService.sendReservationConfirmation(saved);
    return saved;
  }

  findAll(): Promise<Reservation[]> {
    return this.reservationsRepository.find();
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({ where: { id: +id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, updateReservationDto);
    const saved = await this.reservationsRepository.save(reservation);
    this.notificationService.sendUpdateNotification(saved);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reservationsRepository.delete(+id);
    if (result.affected === 0) {
      throw new NotFoundException('Reservation not found');
    }
  }
}
