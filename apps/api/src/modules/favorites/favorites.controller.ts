import type { Request, Response } from 'express'
import { paginationQuerySchema } from '@repo/types'
import * as favoritesService from './favorites.service'

export async function add(req: Request, res: Response) {
  const favorite = await favoritesService.addFavorite(req.user!.userId, req.params.propertyId!)
  res.status(201).json(favorite)
}

export async function remove(req: Request, res: Response) {
  await favoritesService.removeFavorite(req.user!.userId, req.params.propertyId!)
  res.status(204).send()
}

export async function list(req: Request, res: Response) {
  const parsed = paginationQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const result = await favoritesService.getUserFavorites(req.user!.userId, parsed.data)
  res.json(result)
}
