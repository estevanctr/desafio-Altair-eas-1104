import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { UserType } from '../../user/types/user-type';

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const AuthResponseDto = {
  toResponseDto(user: UserType, accessToken: string): AuthResponseDto {
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  },
};

export class AuthResponseSchema extends createZodDto(
  z.object({
    accessToken: z.string(),
    user: z.object({
      id: z.uuid(),
      name: z.string(),
      email: z.email(),
    }),
  }),
) {}
