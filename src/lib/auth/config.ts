import type { NextAuthConfig } from "next-auth";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

/**
 * Edge-safe part of the Auth.js configuration: no database or bcrypt imports,
 * so the proxy (middleware) can decode sessions without pulling Node-only
 * dependencies into its bundle. The Credentials provider lives in ./index.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // Upper bound; the real per-login lifetime is enforced below via
    // token.sessionExpiresAt ("Remember Me" = 30 days, otherwise 24h).
    maxAge: THIRTY_DAYS_MS / 1000,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.sessionExpiresAt =
          Date.now() + (user.rememberMe ? THIRTY_DAYS_MS : ONE_DAY_MS);
      }
      if (
        typeof token.sessionExpiresAt === "number" &&
        Date.now() > token.sessionExpiresAt
      ) {
        // Invalidates the session; the user must sign in again.
        return null;
      }
      return token;
    },
    session({ session, token }) {
      if (token.userId && token.role) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
