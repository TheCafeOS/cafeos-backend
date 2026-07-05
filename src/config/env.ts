import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(4000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),

  CORS_ORIGIN: z
    .string()
    .default("*"),

  JWT_REFRESH_SECRET: z.string().min(32),

  PUBLIC_APP_URL: z.string().url(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),

  CLOUDINARY_API_KEY: z.string().optional(),

  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ Invalid environment variables\n");

  for (const issue of parsed.error.issues) {
    console.error(`• ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = parsed.data;