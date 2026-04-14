import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateUserPasswordController } from '../../controllers/update-user-password.controller';
import type { UpdateUserPasswordResponseDto } from '../../dtos/update-user-password-response-dto';
import { UpdateUserPasswordUseCase } from '../../use-cases/update-user-password-usecase';

describe('UpdateUserPasswordController', () => {
  let useCase: { execute: ReturnType<typeof vi.fn> };
  let controller: UpdateUserPasswordController;

  beforeEach(() => {
    useCase = { execute: vi.fn() };
    controller = new UpdateUserPasswordController(useCase as unknown as UpdateUserPasswordUseCase);
  });

  it('forwards the route param id and body to the use case', async () => {
    const response: UpdateUserPasswordResponseDto = {
      id: 'user-1',
      updatedAt: new Date('2026-04-12T10:00:00Z'),
    };
    useCase.execute.mockResolvedValue(response);

    const result = await controller.handle('user-1', {
      currentPassword: 'current-plain',
      newPassword: 'new-strong-password',
    });

    expect(useCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      currentPassword: 'current-plain',
      newPassword: 'new-strong-password',
    });
    expect(result).toBe(response);
  });

  it('propagates errors thrown by the use case', async () => {
    const error = new Error('boom');
    useCase.execute.mockRejectedValue(error);

    await expect(
      controller.handle('user-1', {
        currentPassword: 'current-plain',
        newPassword: 'new-strong-password',
      }),
    ).rejects.toBe(error);
  });
});
