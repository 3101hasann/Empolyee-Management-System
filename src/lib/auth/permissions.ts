import type { UserRole } from "@/generated/prisma/enums";

/**
 * Central permission registry. Authorization everywhere in the app checks
 * permissions — never roles directly — so future roles (HR, MANAGER, ...)
 * are added by mapping them here, not by editing feature code.
 */
export const PERMISSIONS = [
  "dashboard:read",
  "batch:read",
  "batch:create",
  "batch:update",
  "batch:delete",
  "internee:read",
  "internee:create",
  "internee:update",
  "internee:delete",
  "tenure:read",
  "tenure:create",
  "tenure:update",
  "tenure:delete",
  "lookup:read",
  "lookup:manage",
  "assistant:use",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
