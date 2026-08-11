import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/db";

import { authConfig } from "./config";
import { allowLoginAttempt, resetLoginAttempts } from "./rate-limit";

const credentialsSchema = z.object({
  email: z.email().max(191),
  password: z.string().min(1).max(200),
  rememberMe: z.enum(["true", "false"]).optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        if (!allowLoginAttempt(email)) return null;

        // Identity lives on the linked Person; users holds only credentials.
        const user = await db.user.findFirst({
          where: { person: { email, deletedAt: null } },
          include: { person: true },
        });
        if (!user || !user.isActive) return null;

        const passwordValid = await compare(parsed.data.password, user.passwordHash);
        if (!passwordValid) return null;

        resetLoginAttempts(email);
        return {
          id: String(user.id),
          email: user.person.email,
          name: `${user.person.firstName} ${user.person.lastName}`.trim(),
          role: user.role,
          rememberMe: parsed.data.rememberMe === "true",
        };
      },
    }),
  ],
});
