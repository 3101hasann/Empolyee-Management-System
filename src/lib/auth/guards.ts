import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "./index";
import { roleHasPermission, type Permission } from "./permissions";

export class AuthorizationError extends Error {
  constructor(permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "AuthorizationError";
  }
}

export type SessionUser = Session["user"];

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

/** Page-level guard: redirects to /login when unauthenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Action/query-level guard. Every server action and query function calls this
 * first — the proxy alone is not sufficient (defense in depth).
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!roleHasPermission(user.role, permission)) {
    throw new AuthorizationError(permission);
  }
  return user;
}
