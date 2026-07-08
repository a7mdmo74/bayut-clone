import { config } from 'dotenv'
import { envSchema } from '@repo/types'

// Load environment variables from .env file
config()

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
