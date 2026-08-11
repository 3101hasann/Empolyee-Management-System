import { db } from "@/lib/db";

export async function countInternees(filters: { city?: string; batchName?: string } = {}) {
  const where: any = { deletedAt: null };

  if (filters.city) {
    where.person = { city: { name: { contains: filters.city } } };
  }
  
  if (filters.batchName) {
    where.tenures = { some: { batch: { name: { contains: filters.batchName } } } };
  }

  return db.internee.count({ where });
}

export async function listInternees(filters: { city?: string; batchName?: string; limit?: number } = {}) {
  const where: any = { deletedAt: null };

  if (filters.city) {
    where.person = { city: { name: { contains: filters.city } } };
  }

  if (filters.batchName) {
    where.tenures = { some: { batch: { name: { contains: filters.batchName } } } };
  }

  return db.internee.findMany({
    where,
    take: filters.limit || 10,
    include: {
      person: {
        include: { city: true }
      },
      tenures: {
        include: { batch: true }
      }
    }
  });
}

export async function countBatches(filters: { status?: string } = {}) {
  const where: any = { deletedAt: null };

  if (filters.status) {
    where.status = filters.status.toUpperCase();
  }

  return db.batch.count({ where });
}

export async function listBatches(filters: { status?: string; limit?: number } = {}) {
  const where: any = { deletedAt: null };

  if (filters.status) {
    where.status = filters.status.toUpperCase();
  }

  return db.batch.findMany({
    where,
    take: filters.limit || 10,
    orderBy: { startDate: 'desc' }
  });
}

export async function getGeneralStats() {
  const [totalInternees, totalBatches, activeBatches] = await Promise.all([
    db.internee.count({ where: { deletedAt: null } }),
    db.batch.count({ where: { deletedAt: null } }),
    db.batch.count({ where: { deletedAt: null, status: 'ACTIVE' } })
  ]);

  return {
    totalInternees,
    totalBatches,
    activeBatches
  };
}
