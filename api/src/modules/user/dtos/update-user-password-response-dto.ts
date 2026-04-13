import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export interface UpdateUserPasswordResponseDto {
  id: string;
  updatedAt: Date;
}

export const UpdateUserPasswordResponseDto = {
  toResponseDto(data: {
    id: string;
    updatedAt: Date;
  }): UpdateUserPasswordResponseDto {
    return {
      id: data.id,
      updatedAt: data.updatedAt,
    };
  },
};

export class UpdateUserPasswordResponseSchema extends createZodDto(
  z.object({
    id: z.uuid(),
    updatedAt: z.iso.datetime(),
  }),
) {}
