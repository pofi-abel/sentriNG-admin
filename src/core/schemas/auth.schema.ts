// src/core/schemas/auth.schema.ts - Admin login: password + TOTP
import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
  totp_code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app"),
});

export type Login = z.infer<typeof LoginSchema>;
