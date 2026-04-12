import { describe, expect, it } from 'vitest';
import { UserMapper } from '../../repository/mappers/user-mapper';

describe('UserMapper', () => {
  it('maps a prisma record to a domain user', () => {
    const record = {
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'hashed',
      createdAt: new Date('2026-04-12T10:00:00Z'),
    };

    const domain = UserMapper.toDomain(record);

    expect(domain).toEqual({
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      createdAt: record.createdAt,
    });
  });
});
