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
})
