import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").max(191),
  password: z.string().min(1, "Password is required").max(200),
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
