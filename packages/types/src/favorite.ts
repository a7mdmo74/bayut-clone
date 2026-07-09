import { z } from 'zod'

// No input schema needed for POST/DELETE — only route params
// Pure output shape — backend constructs this
export interface FavoriteDTO {
  id: string
  propertyId: string
  property: {
    id: string
    title: string
    slug: string
    price: string
    propertyType: string
    listingType: string
    bedrooms: number | null
    bathrooms: number | null
    areaSqft: number | null
    community: {
      id: string
      name: string
    } | null
    images: {
      id: string
      url: string
      isCover: boolean
    }[]
  }
  createdAt: string
}
