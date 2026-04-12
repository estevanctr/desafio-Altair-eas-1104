import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { JwtAuthGuard } from '../configs/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('returns the user when authentication succeeds', () => {
    const user = { sub: 'u-1', email: 'j@x.com', name: 'Jane' };

    const result = guard.handleRequest(null, user, undefined);

    expect(result).toBe(user);
  });

  it('throws "Token has expired" when info is TokenExpiredError', () => {
    const info = Object.assign(new Error('jwt expired'), {
      name: 'TokenExpiredError',
    });

    expect(() => guard.handleRequest(null, false, info)).toThrow(
      new UnauthorizedException('Token has expired'),
    );
  });

  it('throws "Invalid token" when info is JsonWebTokenError', () => {
    const info = Object.assign(new Error('jwt malformed'), {
      name: 'JsonWebTokenError',
    });

    expect(() => guard.handleRequest(null, false, info)).toThrow(
      new UnauthorizedException('Invalid token'),
    );
  });

  it('re-throws unexpected errors from passport', () => {
    const err = new Error('unexpected');

    expect(() => guard.handleRequest(err, false, undefined)).toThrow(err);
  });

  it('throws generic Unauthorized when there is no user and no info', () => {
    expect(() => guard.handleRequest(null, false, undefined)).toThrow(
      new UnauthorizedException('Unauthorized'),
    );
  });
});
