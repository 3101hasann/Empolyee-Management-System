import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";

import { listInterneesSchema, type ListInterneesInput } from "./schemas";

const LIST_INCLUDE = {
  person: { include: { city: { select: { id: true, name: true } } } },
  // Latest live tenure provides the "Batch" chip in the list.
  tenures: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { batch: { select: { id: true, name: true, status: true } } },
  },
} satisfies Prisma.InterneeInclude;

export type InterneeListRow = Prisma.InterneeGetPayload<{ include: typeof LIST_INCLUDE }>;

export interface InterneeListResult {
  rows: InterneeListRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function listInternees(input: ListInterneesInput): Promise<InterneeListResult> {
  await requirePermission("internee:read");
  const { page, pageSize, q, batchId, gender } = listInterneesSchema.parse(input);

  const where: Prisma.InterneeWhereInput = {
    deletedAt: null,
    person: {
      deletedAt: null,
      ...(gender ? { gender } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    ...(batchId ? { tenures: { some: { batchId, deletedAt: null } } } : {}),
  };

  const [rows, total] = await db.$transaction([
    db.internee.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.internee.count({ where }),
  ]);

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

const DETAIL_INCLUDE = {
  person: { include: { city: { select: { id: true, name: true } } } },
  tenures: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" as const },
    include: {
      batch: { select: { id: true, name: true, status: true } },
      institute: { select: { id: true, name: true } },
      degree: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.InterneeInclude;

export type InterneeDetail = Prisma.InterneeGetPayload<{ include: typeof DETAIL_INCLUDE }>;

export async function getInterneeById(id: number): Promise<InterneeDetail | null> {
  await requirePermission("internee:read");
  return db.internee.findFirst({
    where: { id, deletedAt: null, person: { deletedAt: null } },
    include: DETAIL_INCLUDE,
  });
}
