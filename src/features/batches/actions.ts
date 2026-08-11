"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { timeInputToMinutes } from "@/lib/utils/time";
import { encodeWeekdays } from "@/lib/utils/weekdays";
import { dateColumn } from "@/lib/utils/zod-helpers";

import { batchFormSchema, type BatchFormValues } from "./schemas";

export type ActionResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";

function toBatchData(values: BatchFormValues) {
  const startTimeMin = timeInputToMinutes(values.startTime);
  const endTimeMin = timeInputToMinutes(values.endTime);
  if (startTimeMin === null || endTimeMin === null) {
    // Unreachable: the schema already validated both times.
    throw new Error("Invalid time value");
  }
  return {
    name: values.name,
    status: values.status,
    startDate: dateColumn(values.startDate),
    endDate: dateColumn(values.endDate),
    startTimeMin,
    endTimeMin,
    daysOfWeek: encodeWeekdays(values.daysOfWeek),
    roadmap: values.roadmap ?? null,
    comments: values.comments ?? null,
  } satisfies Prisma.BatchUncheckedCreateInput;
}

export async function createBatchAction(input: unknown): Promise<ActionResult> {
  await requirePermission("batch:create");
  const parsed = batchFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid batch data. Please review the form." };
  }
  try {
    const batch = await db.batch.create({ data: toBatchData(parsed.data) });
    revalidatePath("/batches");
    return { ok: true, id: batch.id };
  } catch (error) {
    console.error("createBatchAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function updateBatchAction(id: number, input: unknown): Promise<ActionResult> {
  await requirePermission("batch:update");
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: GENERIC_ERROR };
  }
  const parsed = batchFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid batch data. Please review the form." };
  }
  try {
    const result = await db.batch.updateMany({
      where: { id, deletedAt: null },
      data: toBatchData(parsed.data),
    });
    if (result.count === 0) {
      return { ok: false, error: "This batch no longer exists." };
    }
    revalidatePath("/batches");
    revalidatePath(`/batches/${id}`);
    return { ok: true, id };
  } catch (error) {
    console.error("updateBatchAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function deleteBatchAction(id: number): Promise<ActionResult> {
  await requirePermission("batch:delete");
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: GENERIC_ERROR };
  }
  try {
    const result = await db.batch.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      return { ok: false, error: "This batch no longer exists." };
    }
    revalidatePath("/batches");
    return { ok: true, id };
  } catch (error) {
    console.error("deleteBatchAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
