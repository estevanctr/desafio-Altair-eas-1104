import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { Env } from '../../../env';

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class TokenService {
  private readonly accessTokenExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService<Env, true>,
  ) {
    this.accessTokenExpiresIn = configService.get(
      'JWT_ACCESS_TOKEN_EXPIRES_IN',
      { infer: true },
    );
  }

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiresIn,
    } as JwtSignOptions);
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token);
  }
}
