import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET should be at least 16 characters"),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),

  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  VERCEL_URL: z.string().optional()
});

export const env = envSchema.parse(process.env);

