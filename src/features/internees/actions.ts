"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getFileStorage, type StorageFolder } from "@/lib/storage";
import { UPLOAD_LIMITS, validateUpload } from "@/lib/storage/validation";

import { interneePersonalSchema } from "./schemas";

export type ActionResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";

function getUpload(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

/** Validates (magic bytes + size) and stores an uploaded file; null error message on failure. */
async function storeUpload(
  file: File,
  folder: StorageFolder,
  limit: (typeof UPLOAD_LIMITS)[keyof typeof UPLOAD_LIMITS],
): Promise<{ key: string } | { error: string }> {
  const data = new Uint8Array(await file.arrayBuffer());
  const validation = validateUpload(data, limit);
  if (!validation.ok) {
    return {
      error:
        validation.error === "too-large"
          ? "File is too large."
          : "Unsupported file type.",
    };
  }
  const stored = await getFileStorage().save({
    folder,
    data,
    contentType: validation.type.contentType,
    extension: validation.type.extension,
  });
  return { key: stored.key };
}

function isUniqueEmailError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function createInterneeAction(formData: FormData): Promise<ActionResult> {
  await requirePermission("internee:create");

  const parsed = interneePersonalSchema.safeParse(
    Object.fromEntries(
      [...formData.entries()].filter(([, v]) => typeof v === "string"),
    ),
  );
  if (!parsed.success) {
    return { ok: false, error: "Invalid data. Please review the form." };
  }

  let profileImagePath: string | undefined;
  let cvFilePath: string | undefined;

  const profileImage = getUpload(formData, "profileImage");
  if (profileImage) {
    const result = await storeUpload(
      profileImage,
      "profile-images",
      UPLOAD_LIMITS.profileImage,
    );
    if ("error" in result) return { ok: false, error: `Profile picture: ${result.error}` };
    profileImagePath = result.key;
  }

  const cv = getUpload(formData, "cv");
  if (cv) {
    const result = await storeUpload(cv, "cvs", UPLOAD_LIMITS.cv);
    if ("error" in result) return { ok: false, error: `CV: ${result.error}` };
    cvFilePath = result.key;
  }

  const { firstName, lastName, gender, cityId, email, phone, referredBy, fatherName, guardianPhone } =
    parsed.data;

  try {
    const internee = await db.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          firstName,
          lastName,
          gender,
          cityId: cityId ?? null,
          email: email.toLowerCase(),
          phone,
          profileImagePath: profileImagePath ?? null,
          cvFilePath: cvFilePath ?? null,
        },
      });
      return tx.internee.create({
        data: {
          personId: person.id,
          referredBy: referredBy ?? null,
          fatherName: fatherName ?? null,
          guardianPhone: guardianPhone ?? null,
        },
      });
    });
    revalidatePath("/internees");
    return { ok: true, id: internee.id };
  } catch (error) {
    if (isUniqueEmailError(error)) {
      return { ok: false, error: "A person with this email already exists." };
    }
    console.error("createInterneeAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function updateInterneeAction(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  await requirePermission("internee:update");
  if (!Number.isInteger(id) || id < 1) return { ok: false, error: GENERIC_ERROR };

  const existing = await db.internee.findFirst({
    where: { id, deletedAt: null },
    include: { person: true },
  });
  if (!existing) return { ok: false, error: "This internee no longer exists." };

  const parsed = interneePersonalSchema.safeParse(
    Object.fromEntries(
      [...formData.entries()].filter(([, v]) => typeof v === "string"),
    ),
  );
  if (!parsed.success) {
    return { ok: false, error: "Invalid data. Please review the form." };
  }

  let profileImagePath = existing.person.profileImagePath;
  let cvFilePath = existing.person.cvFilePath;
  const replacedFiles: string[] = [];

  const profileImage = getUpload(formData, "profileImage");
  if (profileImage) {
    const result = await storeUpload(
      profileImage,
      "profile-images",
      UPLOAD_LIMITS.profileImage,
    );
    if ("error" in result) return { ok: false, error: `Profile picture: ${result.error}` };
    if (profileImagePath) replacedFiles.push(profileImagePath);
    profileImagePath = result.key;
  }

  const cv = getUpload(formData, "cv");
  if (cv) {
    const result = await storeUpload(cv, "cvs", UPLOAD_LIMITS.cv);
    if ("error" in result) return { ok: false, error: `CV: ${result.error}` };
    if (cvFilePath) replacedFiles.push(cvFilePath);
    cvFilePath = result.key;
  }

  const { firstName, lastName, gender, cityId, email, phone, referredBy, fatherName, guardianPhone } =
    parsed.data;

  try {
    await db.$transaction([
      db.person.update({
        where: { id: existing.personId },
        data: {
          firstName,
          lastName,
          gender,
          cityId: cityId ?? null,
          email: email.toLowerCase(),
          phone,
          profileImagePath,
          cvFilePath,
        },
      }),
      db.internee.update({
        where: { id },
        data: {
          referredBy: referredBy ?? null,
          fatherName: fatherName ?? null,
          guardianPhone: guardianPhone ?? null,
        },
      }),
    ]);
  } catch (error) {
    if (isUniqueEmailError(error)) {
      return { ok: false, error: "A person with this email already exists." };
    }
    console.error("updateInterneeAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }

  // Old files are removed only after the DB update succeeded.
  const storage = getFileStorage();
  await Promise.all(replacedFiles.map((key) => storage.delete(key).catch(() => undefined)));

  revalidatePath("/internees");
  revalidatePath(`/internees/${id}`);
  return { ok: true, id };
}

export async function deleteInterneeAction(id: number): Promise<ActionResult> {
  await requirePermission("internee:delete");
  if (!Number.isInteger(id) || id < 1) return { ok: false, error: GENERIC_ERROR };

  const existing = await db.internee.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return { ok: false, error: "This internee no longer exists." };

  const now = new Date();
  try {
    // Tenures are soft-deleted too so batch intern counts stay honest.
    await db.$transaction([
      db.tenure.updateMany({
        where: { interneeId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      db.internee.update({ where: { id }, data: { deletedAt: now } }),
      db.person.update({ where: { id: existing.personId }, data: { deletedAt: now } }),
    ]);
    revalidatePath("/internees");
    revalidatePath("/batches");
    return { ok: true, id };
  } catch (error) {
    console.error("deleteInterneeAction failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
