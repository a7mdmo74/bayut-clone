import type { Request, Response } from 'express'
import * as auditService from './audit.service'

export async function getAuditLogs(req: Request, res: Response) {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 50
  const targetType = req.query.targetType as string | undefined
  const userId = req.query.userId as string | undefined

  const result = await auditService.getAuditLogs({ page, limit, targetType, userId })
  res.json(result)
}
