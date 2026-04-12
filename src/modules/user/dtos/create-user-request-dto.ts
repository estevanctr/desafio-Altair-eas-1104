import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  requiredString,
} from './schemas/zod-helpers';

export const CreateUserBodySchema = z.object({
  name: requiredString('name'),
  email: emailSchema,
  password: passwordSchema,
});

export type CreateUserBodySchema = z.infer<typeof CreateUserBodySchema>;
export class CreateUserRequestDto extends createZodDto(CreateUserBodySchema) {}
