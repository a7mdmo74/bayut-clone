import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bayara.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/ar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/ar/buy`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/buy`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ar/rent`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/rent`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ar/become-agent`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/en/become-agent`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Fetch active properties for dynamic URLs
  const apiUrl = process.env.API_URL || 'http://localhost:3001'
  let propertyUrls: MetadataRoute.Sitemap = []

  try {
    const res = await fetch(`${apiUrl}/properties?limit=500&sortBy=newest`, {
      next: { revalidate: 3600 },
    })

    if (res.ok) {
      const { data } = await res.json()

      propertyUrls = (data || []).flatMap((property: any) => [
        {
          url: `${baseUrl}/ar/properties/${property.slug}`,
          lastModified: property.createdAt ? new Date(property.createdAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
        {
          url: `${baseUrl}/en/properties/${property.slug}`,
          lastModified: property.createdAt ? new Date(property.createdAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
      ])
    }
  } catch {
    // If API is unreachable, return static URLs only
  }

  return [...staticUrls, ...propertyUrls]
}
