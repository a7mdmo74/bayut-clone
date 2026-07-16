import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { getProperty } from '@/lib/api/properties'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

const PropertyDetailsView = dynamic(
  () => import('@/components/properties/PropertyDetailsView').then(mod => mod.default),
  {
    loading: () => (
      <div className='max-w-6xl mx-auto px-4 py-8'>
        <div className='animate-pulse'>
          <div className='aspect-video bg-muted rounded-xl mb-6' />
          <div className='h-8 bg-muted rounded w-3/4 mb-4' />
          <div className='h-4 bg-muted rounded w-1/2 mb-6' />
          <div className='grid grid-cols-4 gap-4 mb-8'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='h-20 bg-muted rounded' />
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: true,
  }
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params
  const property = await getProperty(slug)
  const t = await getTranslations('property')

  const title = `${property.title} | ${t('metaTitle')}`
  const description = property.description.substring(0, 160)
  const coverImage = property.images?.[0] || '/bayara_primary_logo_horizontal.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE',
      images: [
        {
          url: coverImage,
          alt: property.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
    },
    alternates: {
      canonical: `/${locale}/properties/${slug}`,
      languages: {
        ar: `/ar/properties/${slug}`,
        en: `/en/properties/${slug}`,
      },
    },
  }
}

function PropertyJsonLd({ property, locale }: { property: any, locale: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    image: property.images || [],
    price: property.price,
    priceCurrency: 'AED',
    listingType: property.listingType === 'SALE' ? 'https://schema.org/ForSale' : 'https://schema.org/ForRent',
    propertyType: property.propertyType,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.community?.name || 'UAE',
      addressRegion: property.community?.emirate?.name || 'Dubai',
      addressCountry: 'AE',
    },
    numberOfRooms: property.bedrooms,
    numberOfBedrooms: property.bedrooms,
    numberOfBathrooms: property.bathrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.areaSqft,
      unitCode: 'SQF',
    },
    url: `https://bayara.com/${locale}/properties/${property.slug}`,
    inLanguage: locale,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params
  const property = await getProperty(slug)
  
  return (
    <div className='min-h-screen'>
      <PropertyJsonLd property={property} locale={locale} />
      <Suspense
        fallback={
          <div className='max-w-6xl mx-auto px-4 py-8'>
            <div className='animate-pulse'>
              <div className='aspect-video bg-muted rounded-xl mb-6' />
              <div className='h-8 bg-muted rounded w-3/4 mb-4' />
              <div className='h-4 bg-muted rounded w-1/2 mb-6' />
            </div>
          </div>
        }
      >
        <PropertyContent params={params} />
      </Suspense>
    </div>
  )
}

async function PropertyContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const property = await getProperty(slug)
  return <PropertyDetailsView property={property} />
}
