import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticateController } from '../../controllers/authenticate.controller';
import type { AuthResponseDto } from '../../dtos/auth-response-dto';
import { AuthenticateUseCase } from '../../use-cases/authenticate-usecase';

describe('AuthenticateController', () => {
  let useCase: { execute: ReturnType<typeof vi.fn> };
  let controller: AuthenticateController;

  beforeEach(() => {
    useCase = { execute: vi.fn() };
    controller = new AuthenticateController(
      useCase as unknown as AuthenticateUseCase,
    );
  });

  it('forwards email and password to the use case', async () => {
    const response: AuthResponseDto = {
      accessToken: 'signed-token',
      user: { id: 'u-1', name: 'Jane', email: 'jane@example.com' },
    };
    useCase.execute.mockResolvedValue(response);

    const result = await controller.handle({
      email: 'jane@example.com',
      password: 'plain-password',
    });

    expect(useCase.execute).toHaveBeenCalledWith(
      'jane@example.com',
      'plain-password',
    );
    expect(result).toBe(response);
  });

  it('propagates errors thrown by the use case', async () => {
    const error = new Error('boom');
    useCase.execute.mockRejectedValue(error);

    await expect(
      controller.handle({
        email: 'jane@example.com',
        password: 'plain-password',
      }),
    ).rejects.toBe(error);
  });
});
