import dns from 'node:dns'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { env } from '../config/env'

// Neon resolves AAAA records that often fail from local networks; prefer IPv4
dns.setDefaultResultOrder('ipv4first')

type PoolWithEnded = Pool & { ended?: boolean }

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pgPool?: PoolWithEnded
}

function isPoolUsable(pool: PoolWithEnded | undefined): pool is PoolWithEnded {
  return !!pool && !pool.ended
}

function createPool() {
  // channel_binding=require is unreliable through Neon's pooler with node-pg
  const connectionString = env.DATABASE_URL.replace(
    /([?&])channel_binding=require&?/,
    (_, sep) => (sep === '?' ? '?' : '')
  ).replace(/\?$/, '')

  return new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
  })
}

function getPool() {
  if (isPoolUsable(globalForPrisma.pgPool)) {
    return globalForPrisma.pgPool
  }

  const pool = createPool()
  if (env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool
  }
  return pool
}

function getPrisma() {
  if (globalForPrisma.prisma && isPoolUsable(globalForPrisma.pgPool)) {
    return globalForPrisma.prisma
  }

  // Drop stale client that was bound to an ended pool (common with tsx watch)
  globalForPrisma.prisma = undefined

  const adapter = new PrismaPg(getPool())
  const client = new PrismaClient({ adapter })
  if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

export const prisma = getPrisma()

export async function disconnectPrisma() {
  const client = globalForPrisma.prisma ?? prisma
  const pool = globalForPrisma.pgPool
  globalForPrisma.prisma = undefined
  globalForPrisma.pgPool = undefined

  try {
    await client.$disconnect()
  } catch {
    // ignore disconnect errors during shutdown/reload
  }

  if (isPoolUsable(pool)) {
    try {
      await pool.end()
    } catch {
      // ignore pool end errors during shutdown/reload
    }
  }
}
