import type { Request, Response } from 'express'
import { createSavedSearchSchema } from '@repo/types'
import * as savedSearchesService from './saved-searches.service'

export async function create(req: Request, res: Response) {
  const parsed = createSavedSearchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const savedSearch = await savedSearchesService.createSavedSearch(req.user!.userId, parsed.data)
  res.status(201).json(savedSearch)
}

export async function list(req: Request, res: Response) {
  const savedSearches = await savedSearchesService.getUserSavedSearches(req.user!.userId)
  res.json(savedSearches)
}

export async function remove(req: Request, res: Response) {
  await savedSearchesService.deleteSavedSearch(req.params.id!, req.user!.userId)
  res.status(204).send()
}
