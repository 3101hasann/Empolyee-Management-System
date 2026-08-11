import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    /** Set by the Credentials provider to pick the session lifetime. */
    rememberMe?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
}

// next-auth/jwt re-exports @auth/core/jwt; the augmentation must target the
// module that declares the interface for the callbacks to see it.
declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    role?: UserRole;
    /** Absolute session expiry (ms epoch) enforced in the jwt callback. */
    sessionExpiresAt?: number;
  }
}
