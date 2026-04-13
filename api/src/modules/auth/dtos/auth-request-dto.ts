import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  emailSchema,
  requiredString,
} from '../../user/dtos/schemas/zod-helpers';

export const AuthRequestBodySchema = z.object({
  email: emailSchema,
  password: requiredString('password'),
});

export type AuthRequestBodySchema = z.infer<typeof AuthRequestBodySchema>;
export class AuthRequestDto extends createZodDto(AuthRequestBodySchema) {}
