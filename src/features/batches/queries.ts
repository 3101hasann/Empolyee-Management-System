import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";

import { listBatchesSchema, type ListBatchesInput } from "./schemas";

export type BatchListRow = Prisma.BatchGetPayload<{
  include: { _count: { select: { tenures: true } } };
}>;

export interface BatchListResult {
  rows: BatchListRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function listBatches(input: ListBatchesInput): Promise<BatchListResult> {
  await requirePermission("batch:read");
  const { page, pageSize, q, status } = listBatchesSchema.parse(input);

  const where: Prisma.BatchWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            // Allows searching by the displayed Batch ID.
            ...(/^\d+$/.test(q) ? [{ id: Number(q) }] : []),
          ],
        }
      : {}),
  };

  const [rows, total] = await db.$transaction([
    db.batch.findMany({
      where,
      include: {
        _count: { select: { tenures: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.batch.count({ where }),
  ]);

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getBatchById(id: number) {
  await requirePermission("batch:read");
  return db.batch.findFirst({ where: { id, deletedAt: null } });
}

/** Options for batch dropdowns (tenure form, internee list filter). */
export async function getBatchOptions() {
  await requirePermission("batch:read");
  return db.batch.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, status: true },
    orderBy: { createdAt: "desc" },
  });
}
