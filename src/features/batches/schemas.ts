import { z } from "zod";

import { BatchStatus } from "@/generated/prisma/enums";
import { timeInputToMinutes } from "@/lib/utils/time";
import { WEEKDAYS } from "@/lib/utils/weekdays";
import { dateString, optionalText } from "@/lib/utils/zod-helpers";

const WEEKDAY_KEYS = WEEKDAYS.map((day) => day.key) as [
  (typeof WEEKDAYS)[number]["key"],
  ...(typeof WEEKDAYS)[number]["key"][],
];

const timeString = z
  .string()
  .refine((value) => timeInputToMinutes(value) !== null, "Use a valid time (HH:mm)");

export const batchFormSchema = z
  .object({
    name: z.string().trim().min(1, "Batch name is required").max(100),
    status: z.enum(BatchStatus),
    startDate: dateString,
    endDate: dateString,
    startTime: timeString,
    endTime: timeString,
    daysOfWeek: z.array(z.enum(WEEKDAY_KEYS)).min(1, "Select at least one day"),
    roadmap: optionalText(5000),
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
    const start = timeInputToMinutes(value.startTime);
    const end = timeInputToMinutes(value.endTime);
    if (start !== null && end !== null && end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after the start time",
      });
    }
  });

export type BatchFormInput = z.input<typeof batchFormSchema>;
export type BatchFormValues = z.output<typeof batchFormSchema>;

export const listBatchesSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(5).max(50).catch(10),
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional()
    .catch(undefined),
  status: z.enum(BatchStatus).optional().catch(undefined),
});

export type ListBatchesInput = z.input<typeof listBatchesSchema>;
