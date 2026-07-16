import { z } from 'zod'

export const propertyTypeSchema = z.enum([
  'APARTMENT',
  'VILLA',
  'TOWNHOUSE',
  'PENTHOUSE',
  'STUDIO',
  'OFFICE',
  'RETAIL',
  'WAREHOUSE',
  'LAND',
  'BUILDING',
])
export type PropertyType = z.infer<typeof propertyTypeSchema>

export const listingTypeSchema = z.enum(['SALE', 'RENT'])
export type ListingType = z.infer<typeof listingTypeSchema>

export const listingStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'RESERVED',
  'PENDING',
  'RENTED',
  'SOLD',
  'EXPIRED',
  'REJECTED',
])
export type ListingStatus = z.infer<typeof listingStatusSchema>

export const rentFrequencySchema = z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY'])
export type RentFrequency = z.infer<typeof rentFrequencySchema>

// ---- INPUT: validated at the API boundary ----
export const createPropertySchema = z
  .object({
    title: z.string().min(5).max(200),
    description: z.string().min(20),
    propertyType: propertyTypeSchema,
    listingType: listingTypeSchema,
    price: z.number().positive(),
    rentFrequency: rentFrequencySchema.optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    areaSqft: z.number().positive().optional(),
    furnished: z.boolean().default(false),
    communityId: z.string().uuid().optional(),
    subCommunityId: z.string().uuid().optional(),
    addressLine: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    amenityIds: z.array(z.string().uuid()).optional(),
  })
  .refine(data => (data.listingType === 'RENT' ? !!data.rentFrequency : true), {
    message: 'rentFrequency is required when listingType is RENT',
    path: ['rentFrequency'],
  })
export type CreatePropertyInput = z.infer<typeof createPropertySchema>

export const updatePropertySchema = z
  .object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().min(20).optional(),
    propertyType: propertyTypeSchema.optional(),
    listingType: listingTypeSchema.optional(),
    price: z.number().positive().optional(),
    rentFrequency: rentFrequencySchema.optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    areaSqft: z.number().positive().optional(),
    furnished: z.boolean().optional(),
    communityId: z.string().uuid().optional(),
    subCommunityId: z.string().uuid().optional(),
    addressLine: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    amenityIds: z.array(z.string().uuid()).optional(),
  })
  .refine(data => (data.listingType === 'RENT' ? !!data.rentFrequency : true), {
    message: 'rentFrequency is required when listingType is RENT',
    path: ['rentFrequency'],
  })
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>

export const reviewPropertyStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED']),
})
export type ReviewPropertyStatusInput = z.infer<typeof reviewPropertyStatusSchema>

export const propertySortBySchema = z.enum(['newest', 'price_asc', 'price_desc'])
export type PropertySortBy = z.infer<typeof propertySortBySchema>

export const propertySearchQuerySchema = z.object({
  listingType: listingTypeSchema.optional(),
  propertyType: propertyTypeSchema.optional(),
  communityId: z.string().uuid().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  keyword: z.string().optional(),
  furnished: z.coerce.boolean().optional(),
  sortBy: propertySortBySchema.optional(),
})
export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>

export const addPropertyImageSchema = z.object({
  url: z.string().url(),
  isCover: z.boolean().default(false),
})
export type AddPropertyImageInput = z.infer<typeof addPropertyImageSchema>

// ---- OUTPUT: your backend controls this shape, nothing to validate ----
export interface PropertyDTO {
  id: string
  title: string
  slug: string
  description: string
  propertyType: PropertyType
  listingType: ListingType
  status: ListingStatus
  price: number
  rentFrequency: RentFrequency | null
  bedrooms: number | null
  bathrooms: number | null
  areaSqft: number | null
  community: {
    id: string
    name: string
    emirate: string
  } | null
  images: string[]
  createdAt: string
}
