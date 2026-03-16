import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
    async sendNotification(message: string): Promise<void> {
        console.log('Notification:', message);
    }
}