import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { IHashDriver } from '../../../../drivers/hash/contracts/hash-driver';
import type { IUserRepository } from '../../repository/contracts/user-repository';
import type { UserType } from '../../types/user-type';
import { UpdateUserPasswordUseCase } from '../../use-cases/update-user-password-usecase';

describe('UpdateUserPasswordUseCase', () => {
  let create: Mock;
  let findById: Mock;
  let findByEmail: Mock;
  let updatePassword: Mock;
  let hash: Mock;
  let compare: Mock;
  let useCase: UpdateUserPasswordUseCase;

  const existingUser: UserType = {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'current-hashed',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  const baseInput = {
    userId: existingUser.id,
    currentPassword: 'current-plain',
    newPassword: 'new-plain',
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

    useCase = new UpdateUserPasswordUseCase(userRepository, hashDriver);
  });

  it('updates the password when the current password is correct', async () => {
    findById.mockResolvedValue(existingUser);
    compare.mockResolvedValue(true);
    hash.mockResolvedValue('new-hashed');
    updatePassword.mockResolvedValue({
      ...existingUser,
      password: 'new-hashed',
    });

    const result = await useCase.execute(baseInput);

    expect(findById).toHaveBeenCalledWith(existingUser.id);
    expect(compare).toHaveBeenCalledWith(baseInput.currentPassword, existingUser.password);
    expect(hash).toHaveBeenCalledWith(baseInput.newPassword);
    expect(updatePassword).toHaveBeenCalledWith(existingUser.id, 'new-hashed');
    expect(result.id).toBe(existingUser.id);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('throws NotFoundException when the user does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(NotFoundException);
    expect(compare).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the current password is invalid', async () => {
    findById.mockResolvedValue(existingUser);
    compare.mockResolvedValue(false);

    await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(hash).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });
});
