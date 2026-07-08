import { config } from 'dotenv'
import { envSchema } from '@repo/types'

// Load environment variables from .env file
config()

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
