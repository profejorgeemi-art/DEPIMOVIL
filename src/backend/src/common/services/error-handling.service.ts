import { HttpException, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Injectable()
export class ErrorHandlingService {
    private readonly logger = new Logger(ErrorHandlingService.name);

    public handleError(error: any): void {
        this.logger.error('An error occurred:', error);
        throw new HttpException('Internal Server Error', 500);
    }

    public notFound(message: string): void {
        this.logger.warn('Not Found:', message);
        throw new HttpException(message || 'Not Found', 404);
    }

    public unauthorized(message: string): void {
        this.logger.warn('Unauthorized:', message);
        throw new HttpException(message || 'Unauthorized', 401);
    }
}