"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";

import { loginSchema } from "./schemas";

const GENERIC_LOGIN_ERROR =
  "Invalid email or password. Please check your credentials and try again.";

export interface LoginActionResult {
  error: string;
}

/**
 * Never reveals whether the email exists, the password was wrong, the account
 * is disabled, or the attempt was rate limited — one generic message for all.
 */
export async function loginAction(input: unknown): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      rememberMe: String(parsed.data.rememberMe),
      redirectTo: "/dashboard",
    });
    // signIn always redirects on success; reaching this line means failure.
    return { error: GENERIC_LOGIN_ERROR };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: GENERIC_LOGIN_ERROR };
    }
    // Rethrows the framework's redirect "error" so the redirect happens.
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
