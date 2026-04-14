import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateUserController } from '../../controllers/create-user.controller';
import type { CreateUserResponseDto } from '../../dtos/create-user-response-dto';
import { CreateUserUseCase } from '../../use-cases/create-user-usecase';

describe('CreateUserController', () => {
  let useCase: { execute: ReturnType<typeof vi.fn> };
  let controller: CreateUserController;

  beforeEach(() => {
    useCase = { execute: vi.fn() };
    controller = new CreateUserController(useCase as unknown as CreateUserUseCase);
  });

  it('delegates to the use case and returns its response', async () => {
    const body = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'strong-password',
    };
    const response: CreateUserResponseDto = {
      id: 'user-1',
      name: body.name,
      email: body.email,
      createdAt: new Date('2026-04-12T10:00:00Z'),
    };
    useCase.execute.mockResolvedValue(response);

    const result = await controller.handle(body);

    expect(useCase.execute).toHaveBeenCalledWith(body);
    expect(result).toBe(response);
  });

  it('propagates errors thrown by the use case', async () => {
    const error = new Error('boom');
    useCase.execute.mockRejectedValue(error);

    await expect(
      controller.handle({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'strong-password',
      }),
    ).rejects.toBe(error);
  });
});
