// No input schemas needed — all routes use only params
// Pure output shapes — backend constructs these

export interface EmirateDTO {
  id: string
  name: string
  slug: string
}

export interface CommunityDTO {
  id: string
  name: string
  slug: string
  emirateId: string
}

export interface SubCommunityDTO {
  id: string
  name: string
  slug: string
  communityId: string
}
