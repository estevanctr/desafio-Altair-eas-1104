import { ConfigService } from '@nestjs/config';
import { describe, it, expect, beforeEach } from 'vitest';
import { Env } from '../../../env';
import { HashDriver } from '../hash-driver';

describe('HashDriver', () => {
  let hashDriver: HashDriver;

  beforeEach(() => {
    const configService = {
      get: () => 4,
    } as unknown as ConfigService<Env, true>;
    hashDriver = new HashDriver(configService);
  });

  describe('hash', () => {
    it('should generate a hash from a plain string', async () => {
      const plain = 'my-secret-password';
      const hashed = await hashDriver.hash(plain);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(plain);
    });

    it('should generate different hashes for the same input (salted)', async () => {
      const plain = 'my-secret-password';
      const firstHash = await hashDriver.hash(plain);
      const secondHash = await hashDriver.hash(plain);

      expect(firstHash).not.toBe(secondHash);
    });

    it('should generate a bcrypt-formatted hash', async () => {
      const hashed = await hashDriver.hash('any-value');

      expect(hashed).toMatch(/^\$2[aby]\$\d{2}\$/);
    });
  });

  describe('compare', () => {
    it('should return true when the plain value matches the hash', async () => {
      const plain = 'correct-password';
      const hashed = await hashDriver.hash(plain);

      const result = await hashDriver.compare(plain, hashed);

      expect(result).toBe(true);
    });

    it('should return false when the plain value does not match the hash', async () => {
      const hashed = await hashDriver.hash('correct-password');

      const result = await hashDriver.compare('wrong-password', hashed);

      expect(result).toBe(false);
    });

    it('should return false when comparing against an invalid hash', async () => {
      const result = await hashDriver.compare('any-value', 'not-a-valid-hash');

      expect(result).toBe(false);
    });
  });
});
