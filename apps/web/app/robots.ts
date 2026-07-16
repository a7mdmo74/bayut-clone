import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://bayara.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/agent',
          '/admin',
          '/api',
          '/payments',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
