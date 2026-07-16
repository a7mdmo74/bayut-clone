import { z } from 'zod'

export const envSchema = z
  .object({
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

    // Public URLs used in Stripe Checkout return / cancel redirects
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    API_URL: z.string().url().default('http://localhost:3001'),

    // CORS origin (defaults to * in development, must be set in production)
    CORS_ORIGIN: z.string().default('*'),

    // Email provider (Resend)
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),

    // Stripe — never commit live values; supply via .env / .env.production
    // Leave empty in local dev to use mock checkout when keys are absent.
    STRIPE_SECRET_KEY: z.preprocess(
      v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().optional()
    ),
    STRIPE_WEBHOOK_SECRET: z.preprocess(
      v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.STRIPE_SECRET_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['STRIPE_SECRET_KEY'],
          message: 'STRIPE_SECRET_KEY is required in production',
        })
      } else if (data.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['STRIPE_SECRET_KEY'],
          message:
            'Refusing to start: NODE_ENV=production with a Stripe test key (sk_test_*). Use a live secret key (sk_live_*) in .env.production before deploying.',
        })
      }

      if (!data.STRIPE_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['STRIPE_WEBHOOK_SECRET'],
          message: 'STRIPE_WEBHOOK_SECRET is required in production',
        })
      }
    }

    const hasSecret = !!data.STRIPE_SECRET_KEY
    const hasWebhook = !!data.STRIPE_WEBHOOK_SECRET
    if (hasSecret !== hasWebhook) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasSecret ? ['STRIPE_WEBHOOK_SECRET'] : ['STRIPE_SECRET_KEY'],
        message:
          'STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must both be set, or both omitted (local mock only)',
      })
    }
  })

export type Env = z.infer<typeof envSchema>
