"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getFileStorage } from "@/lib/storage";
import { UPLOAD_LIMITS, validateUpload } from "@/lib/storage/validation";
import { dateColumn, optionalDateColumn } from "@/lib/utils/zod-helpers";

import { tenureFormSchema, type TenureFormValues } from "./schemas";

export type ActionResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";
const DUPLICATE_ERROR = "This internee already has a tenure in that batch.";

function toTenureData(values: TenureFormValues, certFilePath?: string) {
  return {
    batchId: values.batchId,
    startDate: dateColumn(values.startDate),
    endDate: dateColumn(values.endDate),
    instituteId: values.instituteId ?? null,
    degreeId: values.degreeId ?? null,
    degreeStartDate: optionalDateColumn(values.degreeStartDate),
    degreeEndDate: optionalDateColumn(values.degreeEndDate),
    semester: values.semester ?? null,
    grade: values.grade ?? null,
    skills: values.skills ?? null,
    miscCourses: values.miscCourses ?? null,
    skillsLearned: values.skillsLearned ?? null,
    certStartDate: optionalDateColumn(values.certStartDate),
    certEndDate: optionalDateColumn(values.certEndDate),
    certIssueDate: optionalDateColumn(values.certIssueDate),
    score: values.score ?? null,
    comments: values.comments ?? null,
    ...(certFilePath !== undefined ? { certFilePath } : {}),
  };
}

function isDuplicateTenure(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function storeCert(formData: FormData): Promise<
  { key: string | undefined } | { error: string }
> {
  const file = formData.get("certFile");
  if (!(file instanceof File) || file.size === 0) return { key: undefined };
  const data = new Uint8Array(await file.arrayBuffer());
  const validation = validateUpload(data, UPLOAD_LIMITS.certificate);
  if (!validation.ok) {
    return {
      error:
        validation.error === "too-large"
          ? "Certificate: file is too large."
          : "Certificate: unsupported file type.",
    };
  }
  const stored = await getFileStorage().save({
    folder: "certificates",
    data,
    contentType: validation.type.contentType,
    extension: validation.type.extension,
  });
  return { key: stored.key };
}

function parseFields(formData: FormData) {
  return tenureFormSchema.safeParse(
    Object.fromEntries(
      [...formData.entries()].filter(([, v]) => typeof v === "string"),
    ),
  );
}

export async function createTenureAction(
  interneeId: number,
  formData: FormData,
): Promise<ActionResult> {
  await requirePermission("tenure:create");
  if (!Number.isInteger(interneeId) || interneeId < 1) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const internee = await db.internee.findFirst({
    where: { id: interneeId, deletedAt: null },
  });
  if (!internee) return { ok: false, error: "This internee no longer exists." };

  const parsed = parseFields(formData);
  if (!parsed.success) {
    return { ok: false, error: "Invalid data. Please review the form." };
  }

  const batch = await db.batch.findFirst({
    where: { id: parsed.data.batchId, deletedAt: null },
  });
  if (!batch) return { ok: false, error: "The selected batch no longer exists." };

  const cert = await storeCert(formData);
  if ("error" in cert) return { ok: false, error: cert.error };

  try {
    const tenure = await db.tenure.create({
      data: { interneeId, ...toTenureData(parsed.data, cert.key) },
    });
    revalidatePath(`/internees/${interneeId}`);
    revalidatePath("/internees");
    revalidatePath("/batches");
    return { ok: true, id: tenure.id };
  } catch (error) {
    if (isDuplicateTenure(error)) return { ok: false, error: DUPLICATE_ERROR };
    console.error("createTenureAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function updateTenureAction(
  tenureId: number,
  formData: FormData,
): Promise<ActionResult> {
  await requirePermission("tenure:update");
  if (!Number.isInteger(tenureId) || tenureId < 1) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const existing = await db.tenure.findFirst({
    where: { id: tenureId, deletedAt: null },
  });
  if (!existing) return { ok: false, error: "This tenure no longer exists." };

  const parsed = parseFields(formData);
  if (!parsed.success) {
    return { ok: false, error: "Invalid data. Please review the form." };
  }

  const batch = await db.batch.findFirst({
    where: { id: parsed.data.batchId, deletedAt: null },
  });
  if (!batch) return { ok: false, error: "The selected batch no longer exists." };

  const cert = await storeCert(formData);
  if ("error" in cert) return { ok: false, error: cert.error };

  try {
    await db.tenure.update({
      where: { id: tenureId },
      data: toTenureData(parsed.data, cert.key),
    });
  } catch (error) {
    if (isDuplicateTenure(error)) return { ok: false, error: DUPLICATE_ERROR };
    console.error("updateTenureAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }

  // Replaced certificate file is removed only after the DB update succeeded.
  if (cert.key && existing.certFilePath) {
    await getFileStorage()
      .delete(existing.certFilePath)
      .catch(() => undefined);
  }

  revalidatePath(`/internees/${existing.interneeId}`);
  revalidatePath("/batches");
  return { ok: true, id: tenureId };
}

export async function deleteTenureAction(tenureId: number): Promise<ActionResult> {
  await requirePermission("tenure:delete");
  if (!Number.isInteger(tenureId) || tenureId < 1) {
    return { ok: false, error: GENERIC_ERROR };
  }
  try {
    const existing = await db.tenure.findFirst({
      where: { id: tenureId, deletedAt: null },
    });
    if (!existing) return { ok: false, error: "This tenure no longer exists." };

    await db.tenure.update({
      where: { id: tenureId },
      data: { deletedAt: new Date() },
    });
    revalidatePath(`/internees/${existing.interneeId}`);
    revalidatePath("/batches");
    return { ok: true, id: tenureId };
  } catch (error) {
    console.error("deleteTenureAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
