import type { Request, Response } from 'express'
import * as agenciesService from './agencies.service'

export async function create(req: Request, res: Response) {
  const { name, description, phone, email, website, licenseNo, logoUrl } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })

  const agency = await agenciesService.createAgency({
    name, description, phone, email, website, licenseNo, logoUrl,
  })
  res.status(201).json(agency)
}

export async function list(req: Request, res: Response) {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 20
  const result = await agenciesService.getAgencies(page, limit)
  res.json(result)
}

export async function getOne(req: Request, res: Response) {
  const id = req.params.id as string
  const agency = await agenciesService.getAgencyById(id)
  res.json(agency)
}

export async function update(req: Request, res: Response) {
  const id = req.params.id as string
  const agency = await agenciesService.updateAgency(id, req.body)
  res.json(agency)
}

export async function verify(req: Request, res: Response) {
  const id = req.params.id as string
  const agency = await agenciesService.verifyAgency(id)
  res.json(agency)
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id as string
  await agenciesService.deleteAgency(id)
  res.status(204).send()
}
