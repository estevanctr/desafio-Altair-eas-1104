import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateUserBodySchema,
  CreateUserRequestDto,
} from '../dtos/create-user-request-dto';
import type { CreateUserResponseDto } from '../dtos/create-user-response-dto';
import { CreateUserUseCase } from '../use-cases/create-user-usecase';

@Controller('users')
export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(CreateUserBodySchema))
    body: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    return this.createUserUseCase.execute(body);
  }
}
