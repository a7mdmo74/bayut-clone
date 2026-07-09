import type { Request, Response } from 'express'
import { presignUploadSchema } from '@repo/types'
import * as uploadsService from './uploads.service'

export async function presign(req: Request, res: Response) {
  const parsed = presignUploadSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }
  const result = await uploadsService.generatePresignedUrl(parsed.data)
  res.json(result)
}

export async function presignGet(req: Request, res: Response) {
  const { key } = req.query
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'key is required' })
  }
  const result = await uploadsService.generatePresignedGetUrl(key)
  res.json(result)
}

export async function serveFile(req: Request, res: Response) {
  const key = req.params[0] // For wildcard routes, the captured path is in params[0]
  if (!key) {
    return res.status(400).json({ error: 'key is required' })
  }

  try {
    const stream = await uploadsService.getFileStream(key)

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600')

    // Pipe the S3 stream to the response
    if (stream && typeof (stream as any).pipe === 'function') {
      (stream as any).pipe(res)

      (stream as any).on('error', (error: any) => {
        console.error('Stream error:', error)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to serve file' })
        }
      })

      (stream as any).on('end', () => {
        // Stream ended successfully
      })
    } else {
      res.status(500).json({ error: 'Failed to serve file - invalid stream' })
    }
  } catch (error: any) {
    console.error('Serve file error:', error)
    if (!res.headersSent) {
      res
        .status(500)
        .json({
          error: 'Failed to serve file',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
    }
  }
}
