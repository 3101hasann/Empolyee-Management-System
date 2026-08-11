import { z } from "zod";

import {
  dateString,
  optionalDateString,
  optionalId,
  optionalText,
} from "@/lib/utils/zod-helpers";

const optionalSemester = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().min(1, "Semester must be 1-20").max(20).optional(),
);

const optionalScore = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().min(0, "Score must be 0-100").max(100).optional(),
);

export const tenureFormSchema = z
  .object({
    batchId: z.coerce.number({ error: "Select a batch" }).int().min(1, "Select a batch"),
    startDate: dateString,
    endDate: dateString,
    instituteId: optionalId,
    degreeId: optionalId,
    degreeStartDate: optionalDateString,
    degreeEndDate: optionalDateString,
    semester: optionalSemester,
    grade: optionalText(5),
    skills: optionalText(5000),
    miscCourses: optionalText(5000),
    skillsLearned: optionalText(5000),
    certStartDate: optionalDateString,
    certEndDate: optionalDateString,
    certIssueDate: optionalDateString,
    score: optionalScore,
    comments: optionalText(5000),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date",
      });
    }
    if (
      value.degreeStartDate &&
      value.degreeEndDate &&
      value.degreeEndDate < value.degreeStartDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["degreeEndDate"],
        message: "Degree end must be on or after its start",
      });
    }
  });

export type TenureFormInput = z.input<typeof tenureFormSchema>;
export type TenureFormValues = z.output<typeof tenureFormSchema>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Client (RHF) shape — strings throughout; server schema stays authoritative. */
export const tenureClientSchema = z
  .object({
    batchId: z.string().min(1, "Select a batch"),
    startDate: z.string().regex(DATE_RE, "Required"),
    endDate: z.string().regex(DATE_RE, "Required"),
    instituteId: z.string(),
    degreeId: z.string(),
    degreeStartDate: z.string(),
    degreeEndDate: z.string(),
    semester: z
      .string()
      .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 20), {
        message: "Semester must be 1-20",
      }),
    grade: z.string().trim().max(5),
    skills: z.string().max(5000),
    miscCourses: z.string().max(5000),
    skillsLearned: z.string().max(5000),
    certStartDate: z.string(),
    certEndDate: z.string(),
    certIssueDate: z.string(),
    score: z
      .string()
      .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100), {
        message: "Score must be 0-100",
      }),
    comments: z.string().max(5000),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date",
      });
    }
  });

export type TenureClientFormValues = z.infer<typeof tenureClientSchema>;
