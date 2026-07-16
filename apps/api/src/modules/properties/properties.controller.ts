import type { Request, Response } from 'express'
import {
  createPropertySchema,
  updatePropertySchema,
  propertySearchQuerySchema,
  paginationQuerySchema,
  addPropertyImageSchema,
} from '@repo/types'
import * as propertiesService from './properties.service'

export async function create(req: Request, res: Response) {
  const parsed = createPropertySchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const property = await propertiesService.createProperty(req.user!.userId, parsed.data)
  res.status(201).json(property)
}

export async function getOne(req: Request, res: Response) {
  const property = await propertiesService.getPropertyBySlug(req.params.slug!)
  res.json(property)
}

export async function search(req: Request, res: Response) {
  const filtersParsed = propertySearchQuerySchema.safeParse(req.query)
  const paginationParsed = paginationQuerySchema.safeParse(req.query)

  if (!filtersParsed.success || !paginationParsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: {
        ...filtersParsed.error?.flatten().fieldErrors,
        ...paginationParsed.error?.flatten().fieldErrors,
      },
    })
  }

  const result = await propertiesService.searchProperties(filtersParsed.data, paginationParsed.data)
  res.json(result)
}

export async function update(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const parsed = updatePropertySchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const role = req.user.role || 'BUYER'
  const property = await propertiesService.updateProperty(
    req.params.id!,
    req.user.userId,
    role,
    parsed.data
  )
  res.json(property)
}

export async function remove(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const role = req.user.role || 'BUYER'
  await propertiesService.deleteProperty(req.params.id!, req.user.userId, role)
  res.status(204).send()
}

export async function addImage(req: Request, res: Response) {
  const parsed = addPropertyImageSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const image = await propertiesService.addPropertyImage(
    req.params.id!,
    req.user!.userId,
    parsed.data.url,
    parsed.data.isCover
  )
  res.status(201).json(image)
}

export async function getFeatured(req: Request, res: Response) {
  const limit = req.query.limit ? Number(req.query.limit) : 6
  const properties = await propertiesService.getFeaturedProperties(limit)
  res.json(properties)
}
