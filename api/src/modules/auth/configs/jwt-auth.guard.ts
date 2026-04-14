import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T = unknown>(err: Error | null, user: T | false, info: Error | undefined): T {
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired');
    }

    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Invalid token');
    }

    if (err) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }
}
