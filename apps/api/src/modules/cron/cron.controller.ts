import type { Request, Response } from 'express'
import * as cronService from './cron.service'

export async function runCronJobs(req: Request, res: Response) {
  // Simple auth check — only allow from internal/cron secret
  const cronSecret = req.headers['x-cron-secret']
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const results = await cronService.runAllCronJobs()
  res.json({ success: true, results })
}

export async function healthCheck(req: Request, res: Response) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
}
