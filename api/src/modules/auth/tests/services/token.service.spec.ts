import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenService } from '../../services/token.service';

describe('TokenService', () => {
  let sign: ReturnType<typeof vi.fn>;
  let verify: ReturnType<typeof vi.fn>;
  let service: TokenService;

  beforeEach(() => {
    sign = vi.fn();
    verify = vi.fn();
    const jwtService = { sign, verify } as unknown as JwtService;
    const configService = {
      get: vi.fn().mockReturnValue('4h'),
    } as unknown as ConfigService;
    service = new TokenService(jwtService, configService as unknown as ConstructorParameters<typeof TokenService>[1]);
  });

  it('signs the payload with the expiration read from env', () => {
    sign.mockReturnValue('signed-token');

    const payload = { sub: 'u-1', email: 'j@x.com', name: 'Jane' };
    const result = service.generateAccessToken(payload);

    expect(sign).toHaveBeenCalledWith(payload, { expiresIn: '4h' });
    expect(result).toBe('signed-token');
  });

  it('delegates verification to JwtService', () => {
    const decoded = { sub: 'u-1', email: 'j@x.com', name: 'Jane' };
    verify.mockReturnValue(decoded);

    const result = service.verifyAccessToken('a-token');

    expect(verify).toHaveBeenCalledWith('a-token');
    expect(result).toBe(decoded);
  });
});
