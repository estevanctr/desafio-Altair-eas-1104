import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const isoDate = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({
        code: 'custom',
        message: 'must be a valid ISO date',
      });
      return z.NEVER;
    }
    return parsed;
  });

const listProcessesQueryObject = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined) return 1;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
    }),
  courtAcronym: z.string().trim().min(1).optional(),
  processNumber: z.string().trim().min(1).optional(),
  publicationDateFrom: isoDate,
  publicationDateTo: isoDate,
});

export const ListProcessesQuerySchema = listProcessesQueryObject.refine(
  (data) => !data.publicationDateFrom || !data.publicationDateTo || data.publicationDateFrom <= data.publicationDateTo,
  {
    message: 'publicationDateFrom must be before or equal to publicationDateTo',
    path: ['publicationDateFrom'],
  },
);

export type ListProcessesQuerySchema = z.infer<typeof listProcessesQueryObject>;
export class ListProcessesRequestDto extends createZodDto(listProcessesQueryObject) {}
