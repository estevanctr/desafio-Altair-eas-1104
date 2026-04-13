import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { IHashDriver } from '../../../../drivers/hash/contracts/hash-driver';
import type { IUserRepository } from '../../../user/repository/contracts/user-repository';
import type { UserType } from '../../../user/types/user-type';
import { TokenService } from '../../services/token.service';
import { AuthenticateUseCase } from '../../use-cases/authenticate-usecase';

describe('AuthenticateUseCase', () => {
  let create: Mock;
  let findById: Mock;
  let findByEmail: Mock;
  let updatePassword: Mock;
  let hash: Mock;
  let compare: Mock;
  let generateAccessToken: Mock;
  let useCase: AuthenticateUseCase;

  const existingUser: UserType = {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    create = vi.fn();
    findById = vi.fn();
    findByEmail = vi.fn();
    updatePassword = vi.fn();
    hash = vi.fn();
    compare = vi.fn();
    generateAccessToken = vi.fn();

    const userRepository: IUserRepository = {
      create,
      findById,
      findByEmail,
      updatePassword,
    };
    const hashDriver: IHashDriver = { hash, compare };
    const tokenService = {
      generateAccessToken,
    } as unknown as TokenService;

    useCase = new AuthenticateUseCase(userRepository, hashDriver, tokenService);
  });

  it('returns an access token when credentials are valid', async () => {
    findByEmail.mockResolvedValue(existingUser);
    compare.mockResolvedValue(true);
    generateAccessToken.mockReturnValue('signed-token');

    const result = await useCase.execute(existingUser.email, 'plain-password');

    expect(findByEmail).toHaveBeenCalledWith(existingUser.email);
    expect(compare).toHaveBeenCalledWith('plain-password', existingUser.password);
    expect(generateAccessToken).toHaveBeenCalledWith({
      sub: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
    });
    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
    });
  });

  it('throws UnauthorizedException when the user does not exist', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute('missing@example.com', 'any'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(compare).not.toHaveBeenCalled();
    expect(generateAccessToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the password does not match', async () => {
    findByEmail.mockResolvedValue(existingUser);
    compare.mockResolvedValue(false);

    await expect(
      useCase.execute(existingUser.email, 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(generateAccessToken).not.toHaveBeenCalled();
  });

  it('uses the same error message for missing user and wrong password', async () => {
    findByEmail.mockResolvedValueOnce(null);
    const missingUserErr: Error = await useCase
      .execute('missing@example.com', 'x')
      .then(() => new Error('did not throw'))
      .catch((e: Error) => e);

    findByEmail.mockResolvedValueOnce(existingUser);
    compare.mockResolvedValueOnce(false);
    const wrongPasswordErr: Error = await useCase
      .execute(existingUser.email, 'x')
      .then(() => new Error('did not throw'))
      .catch((e: Error) => e);

    expect(missingUserErr.message).toBe(wrongPasswordErr.message);
  });
});
