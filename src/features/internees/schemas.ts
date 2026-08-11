import { z } from "zod";

import { Gender } from "@/generated/prisma/enums";
import { optionalId } from "@/lib/utils/zod-helpers";

/** Empty strings from optional inputs become undefined. */
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional();

const phoneString = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 -]{6,18}$/, "Enter a valid phone number");

export const interneePersonalSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  gender: z.enum(Gender),
  cityId: optionalId,
  email: z.email("Enter a valid email address").max(191),
  phone: phoneString,
  referredBy: optionalTrimmed(100),
  fatherName: optionalTrimmed(100),
  guardianPhone: phoneString
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type InterneePersonalInput = z.input<typeof interneePersonalSchema>;
export type InterneePersonalValues = z.output<typeof interneePersonalSchema>;

export const listInterneesSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(5).max(50).catch(10),
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional()
    .catch(undefined),
  batchId: z.coerce.number().int().min(1).optional().catch(undefined),
  gender: z.enum(Gender).optional().catch(undefined),
});

export type ListInterneesInput = z.input<typeof listInterneesSchema>;

const PHONE_REGEX = /^\+?[0-9][0-9 -]{6,18}$/;

/**
 * Client-side (React Hook Form) shape: every field a string so native inputs
 * and selects bind cleanly. The server action re-validates with
 * `interneePersonalSchema`, which stays authoritative.
 */
export const interneePersonalClientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  gender: z.enum(Gender, { error: "Select a gender" }),
  cityId: z.string(),
  email: z.email("Enter a valid email address").max(191),
  phone: z.string().trim().regex(PHONE_REGEX, "Enter a valid phone number"),
  referredBy: z.string().trim().max(100),
  fatherName: z.string().trim().max(100),
  guardianPhone: z
    .string()
    .trim()
    .refine((v) => v === "" || PHONE_REGEX.test(v), "Enter a valid phone number"),
});

export type InterneePersonalFormValues = z.infer<typeof interneePersonalClientSchema>;
