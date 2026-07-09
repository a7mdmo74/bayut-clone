import type { Request, Response } from 'express'
import * as locationsService from './locations.service'

export async function listEmirates(req: Request, res: Response) {
  const emirates = await locationsService.getAllEmirates()
  res.json(emirates)
}

export async function listCommunities(req: Request, res: Response) {
  const communities = await locationsService.getCommunitiesByEmirate(req.params.emirateId!)
  res.json(communities)
}

export async function listSubCommunities(req: Request, res: Response) {
  const subCommunities = await locationsService.getSubCommunitiesByCommunity(req.params.communityId!)
  res.json(subCommunities)
}
