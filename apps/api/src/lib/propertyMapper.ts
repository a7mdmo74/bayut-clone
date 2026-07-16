import type { PropertyDTO } from '@repo/types'

export function toPropertyDTO(property: any): PropertyDTO {
  return {
    id: property.id,
    title: property.title,
    slug: property.slug,
    description: property.description ?? '',
    propertyType: property.propertyType,
    listingType: property.listingType,
    status: property.status,
    price: Number(property.price),
    rentFrequency: property.rentFrequency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft ? Number(property.areaSqft) : null,
    community: property.community
      ? {
          id: property.community.id,
          name: property.community.name,
          emirate: property.community.emirate?.name || 'Unknown',
        }
      : null,
    images: property.images?.map((img: any) => (typeof img === 'string' ? img : img.url)) || [],
    createdAt: property.createdAt?.toISOString?.() ?? property.createdAt,
  }
}
