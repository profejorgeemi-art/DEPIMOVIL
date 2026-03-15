import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return false; // Token is missing
    }

    try {
      const user = this.jwtService.verify(token);
      request.user = user; // Attach user information to request
      return true; // Token is valid
    } catch (error) {
      return false; // Invalid token
    }
  }
}