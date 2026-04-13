import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { passwordSchema, requiredString } from './schemas/zod-helpers';

export const UpdateUserPasswordBodySchema = z.object({
  currentPassword: requiredString('currentPassword'),
  newPassword: passwordSchema,
});

export type UpdateUserPasswordBodySchema = z.infer<
  typeof UpdateUserPasswordBodySchema
>;
export class UpdateUserPasswordRequestDto extends createZodDto(
  UpdateUserPasswordBodySchema,
) {}
