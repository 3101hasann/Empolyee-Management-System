import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export interface DashboardKpis {
  totalBatches: number;
  activeBatches: number;
  closedBatches: number;
  totalInternees: number;
  batchesThisMonth: number;
  interneesThisMonth: number;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  await requirePermission("dashboard:read");
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalBatches,
    activeBatches,
    closedBatches,
    totalInternees,
    batchesThisMonth,
    interneesThisMonth,
  ] = await db.$transaction([
    db.batch.count({ where: { deletedAt: null } }),
    db.batch.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.batch.count({ where: { deletedAt: null, status: "CLOSED" } }),
    db.internee.count({ where: { deletedAt: null, person: { deletedAt: null } } }),
    db.batch.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } }),
    db.internee.count({
      where: { deletedAt: null, person: { deletedAt: null }, createdAt: { gte: monthStart } },
    }),
  ]);

  return {
    totalBatches,
    activeBatches,
    closedBatches,
    totalInternees,
    batchesThisMonth,
    interneesThisMonth,
  };
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export interface MonthlyPoint {
  month: (typeof MONTH_LABELS)[number];
  batches: number;
  internees: number;
}

/** New batches / internees per calendar month of `year` (by createdAt, UTC). */
export async function getMonthlySeries(year: number): Promise<MonthlyPoint[]> {
  await requirePermission("dashboard:read");
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  const createdInYear = { gte: from, lt: to };

  // Row counts are small (dozens/year) — bucketing in JS beats raw SQL here.
  const [batches, internees] = await Promise.all([
    db.batch.findMany({
      where: { deletedAt: null, createdAt: createdInYear },
      select: { createdAt: true },
    }),
    db.internee.findMany({
      where: { deletedAt: null, person: { deletedAt: null }, createdAt: createdInYear },
      select: { createdAt: true },
    }),
  ]);

  const points: MonthlyPoint[] = MONTH_LABELS.map((month) => ({
    month,
    batches: 0,
    internees: 0,
  }));
  for (const b of batches) points[b.createdAt.getUTCMonth()].batches += 1;
  for (const i of internees) points[i.createdAt.getUTCMonth()].internees += 1;
  return points;
}

const RECENT_INCLUDE = {
  _count: { select: { tenures: { where: { deletedAt: null } } } },
} satisfies Prisma.BatchInclude;

export type RecentBatch = Prisma.BatchGetPayload<{ include: typeof RECENT_INCLUDE }>;

export async function getRecentBatches(limit = 5): Promise<RecentBatch[]> {
  await requirePermission("dashboard:read");
  return db.batch.findMany({
    where: { deletedAt: null },
    include: RECENT_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
