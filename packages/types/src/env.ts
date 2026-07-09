import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z
    .string()
    .regex(/^\d+[smhd]$/, 'Must be a duration like "15m", "1h", "7d"')
    .default('15m'),
  JWT_REFRESH_EXPIRY: z
    .string()
    .regex(/^\d+[smhd]$/, 'Must be a duration like "15m", "1h", "7d"')
    .default('7d'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
})
