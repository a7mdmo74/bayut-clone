import type { Request, Response } from 'express'
import { createAmenitySchema } from '@repo/types'
import * as amenitiesService from './amenities.service'

export async function list(req: Request, res: Response) {
  const amenities = await amenitiesService.getAllAmenities()
  res.json(amenities)
}

export async function create(req: Request, res: Response) {
  const parsed = createAmenitySchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const amenity = await amenitiesService.createAmenity(parsed.data)
  res.status(201).json(amenity)
}
