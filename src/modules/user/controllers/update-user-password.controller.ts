import { Body, Controller, HttpCode, Param, Patch } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  UpdateUserPasswordBodySchema,
  UpdateUserPasswordRequestDto,
} from '../dtos/update-user-password-request-dto';
import type { UpdateUserPasswordResponseDto } from '../dtos/update-user-password-response-dto';
import { UpdateUserPasswordUseCase } from '../use-cases/update-user-password-usecase';

@Controller('users')
export class UpdateUserPasswordController {
  constructor(
    private readonly updateUserPasswordUseCase: UpdateUserPasswordUseCase,
  ) {}

  @Patch(':id/password')
  @HttpCode(200)
  async handle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserPasswordBodySchema))
    body: UpdateUserPasswordRequestDto,
  ): Promise<UpdateUserPasswordResponseDto> {
    return this.updateUserPasswordUseCase.execute({
      userId: id,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  }
}
