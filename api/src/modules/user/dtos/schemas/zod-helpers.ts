import { z } from 'zod';

export const requiredString = (field: string) =>
  z
    .string({ error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`);

export const emailSchema = z
  .string({ error: 'email is required' })
  .trim()
  .pipe(z.email('email must be a valid e-mail'));

export const passwordSchema = z
  .string({ error: 'password is required' })
  .min(8, 'password must be at least 8 characters');
