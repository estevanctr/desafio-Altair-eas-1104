import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../../database/prisma/prisma.service';
import { UserRepository } from '../../repository/user-repository';

describe('UserRepository', () => {
  let prisma: {
    user: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let repository: UserRepository;

  const record = {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'hashed',
    createdAt: new Date('2026-04-12T10:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    repository = new UserRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('persists the user and returns a domain object', async () => {
      prisma.user.create.mockResolvedValue(record);

      const result = await repository.create({
        name: record.name,
        email: record.email,
        password: record.password,
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: record.name,
          email: record.email,
          password: record.password,
        },
      });
      expect(result).toEqual(record);
    });
  });

  describe('findById', () => {
    it('returns the domain user when the record exists', async () => {
      prisma.user.findUnique.mockResolvedValue(record);

      const result = await repository.findById(record.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: record.id },
      });
      expect(result).toEqual(record);
    });

    it('returns null when the record does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns the domain user when the record exists', async () => {
      prisma.user.findUnique.mockResolvedValue(record);

      const result = await repository.findByEmail(record.email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: record.email },
      });
      expect(result).toEqual(record);
    });

    it('returns null when the record does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('updates the password field and returns the updated domain user', async () => {
      const updated = { ...record, password: 'new-hashed' };
      prisma.user.update.mockResolvedValue(updated);

      const result = await repository.updatePassword(record.id, 'new-hashed');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: record.id },
        data: { password: 'new-hashed' },
      });
      expect(result).toEqual(updated);
    });
  });
});
