import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export interface LookupOption {
  id: number;
  name: string;
}

export async function getInstitutes(): Promise<LookupOption[]> {
  await requirePermission("lookup:read");
  return db.institute.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getDegrees(): Promise<LookupOption[]> {
  await requirePermission("lookup:read");
  return db.degree.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getCities(): Promise<LookupOption[]> {
  await requirePermission("lookup:read");
  return db.city.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
