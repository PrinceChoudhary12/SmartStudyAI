import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  APP_NAME: z.string().default('SmartStudy AI'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/smartstudy_ai?schema=public'),
  AUTH_SECRET: z.string().min(32).default('dev-auth-secret-change-me-please-1234'),
  AUTH_COOKIE_NAME: z.string().default('smartstudy_session'),
});

export const env = envSchema.parse(process.env);
