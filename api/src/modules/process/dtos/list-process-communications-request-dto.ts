import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListProcessCommunicationsQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined) return 1;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
    }),
});

export type ListProcessCommunicationsQuerySchema = z.infer<typeof ListProcessCommunicationsQuerySchema>;
export class ListProcessCommunicationsRequestDto extends createZodDto(ListProcessCommunicationsQuerySchema) {}
