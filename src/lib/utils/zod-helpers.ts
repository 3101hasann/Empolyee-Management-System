import { z } from "zod";

/** "YYYY-MM-DD" from <input type="date">. */
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .refine(
    (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
    "Use a valid date",
  );

/** Optional date input — empty string means "not provided". */
export const optionalDateString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  dateString.optional(),
);

/** Optional free text; empty string becomes undefined. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional();

/** Optional positive integer id from a select ("" = none selected). */
export const optionalId = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.number().int().min(1).optional(),
);

/** "YYYY-MM-DD" -> UTC midnight Date, safe for MySQL DATE columns. */
export function dateColumn(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function optionalDateColumn(value: string | undefined): Date | null {
  return value ? dateColumn(value) : null;
}
