import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  AuthRequestBodySchema,
  AuthRequestDto,
} from '../dtos/auth-request-dto';
import type { AuthResponseDto } from '../dtos/auth-response-dto';
import { AuthResponseSchema } from '../dtos/auth-response-dto';
import { AuthenticateUseCase } from '../use-cases/authenticate-usecase';

@ApiTags('Auth')
@Controller('auth')
export class AuthenticateController {
  constructor(private readonly authenticateUseCase: AuthenticateUseCase) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate and receive a JWT access token' })
  @ApiOkResponse({ type: AuthResponseSchema })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async handle(
    @Body(new ZodValidationPipe(AuthRequestBodySchema))
    body: AuthRequestDto,
  ): Promise<AuthResponseDto> {
    return this.authenticateUseCase.execute(body.email, body.password);
  }
}
