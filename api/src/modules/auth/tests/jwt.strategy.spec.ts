import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { JwtStrategy } from '../configs/jwt.strategy';

describe('JwtStrategy', () => {
  const fakeConfig = {
    get: () => Buffer.from('fake-public-key').toString('base64'),
  } as unknown as ConstructorParameters<typeof JwtStrategy>[0];

  it('returns the parsed payload when structure is valid', () => {
    const strategy = new JwtStrategy(fakeConfig);

    const result = strategy.validate({
      sub: 'u-1',
      email: 'jane@example.com',
      name: 'Jane',
    });

    expect(result).toEqual({
      sub: 'u-1',
      email: 'jane@example.com',
      name: 'Jane',
    });
  });

  it('throws ZodError when payload is missing fields', () => {
    const strategy = new JwtStrategy(fakeConfig);

    expect(() => strategy.validate({ sub: 'u-1' })).toThrow(ZodError);
  });

  it('throws ZodError when payload field types are wrong', () => {
    const strategy = new JwtStrategy(fakeConfig);

    expect(() => strategy.validate({ sub: 1, email: 'jane@example.com', name: 'Jane' })).toThrow(ZodError);
  });
});
