import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { UserType } from '../types/user-type';

export interface CreateUserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export const CreateUserResponseDto = {
  toResponseDto(user: UserType): CreateUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  },
};

export class CreateUserResponseSchema extends createZodDto(
  z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    createdAt: z.iso.datetime(),
  }),
) {}
