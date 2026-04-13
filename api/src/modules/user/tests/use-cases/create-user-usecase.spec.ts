import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { IHashDriver } from '../../../../drivers/hash/contracts/hash-driver';
import type { IUserRepository } from '../../repository/contracts/user-repository';
import type { UserType } from '../../types/user-type';
import { CreateUserUseCase } from '../../use-cases/create-user-usecase';

describe('CreateUserUseCase', () => {
  let create: Mock;
  let findById: Mock;
  let findByEmail: Mock;
  let updatePassword: Mock;
  let hash: Mock;
  let compare: Mock;
  let useCase: CreateUserUseCase;

  const baseInput = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'plain-password',
  };

  beforeEach(() => {
    create = vi.fn();
    findById = vi.fn();
    findByEmail = vi.fn();
    updatePassword = vi.fn();
    hash = vi.fn();
    compare = vi.fn();

    const userRepository: IUserRepository = {
      create,
      findById,
      findByEmail,
      updatePassword,
    };
    const hashDriver: IHashDriver = { hash, compare };

    useCase = new CreateUserUseCase(userRepository, hashDriver);
  });

  it('creates a user, hashing the password before persisting', async () => {
    const createdUser: UserType = {
      id: 'user-1',
      name: baseInput.name,
      email: baseInput.email,
      password: 'hashed-password',
      createdAt: new Date('2026-04-12T10:00:00Z'),
    };
    findByEmail.mockResolvedValue(null);
    hash.mockResolvedValue('hashed-password');
    create.mockResolvedValue(createdUser);

    const result = await useCase.execute(baseInput);

    expect(findByEmail).toHaveBeenCalledWith(baseInput.email);
    expect(hash).toHaveBeenCalledWith(baseInput.password);
    expect(create).toHaveBeenCalledWith({
      name: baseInput.name,
      email: baseInput.email,
      password: 'hashed-password',
    });
    expect(result).toEqual({
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      createdAt: createdUser.createdAt,
    });
    expect(result).not.toHaveProperty('password');
  });

  it('throws ConflictException when the e-mail is already in use', async () => {
    findByEmail.mockResolvedValue({
      id: 'existing',
      name: 'Other',
      email: baseInput.email,
      password: 'hashed',
      createdAt: new Date(),
    });

    await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(hash).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
