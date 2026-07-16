import { Suspense } from 'react'
import { searchProperties } from '@/lib/api/properties'
import { PropertyCardSkeleton } from '@/components/properties/PropertCard'
import { PropertiesGridClient } from '@/components/properties/PropertiesGridClient'
import { PropertyFilters } from '@/components/properties/PropertyFilters'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { PropertySearchQuery } from '@repo/types'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'search' })

  return {
    title: t('buyTitle'),
    description: 'Browse properties for sale in the UAE. Find apartments, villas, and townhouses across Dubai, Abu Dhabi, and Sharjah.',
    openGraph: {
      title: t('buyTitle'),
      description: 'Browse properties for sale in the UAE. Find apartments, villas, and townhouses across Dubai, Abu Dhabi, and Sharjah.',
      type: 'website',
    },
  }
}

export default function BuyPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{
    q?: string
    type?: string
    priceRange?: string
    bedrooms?: string
    bathrooms?: string
    furnished?: string
    sortBy?: string
    page?: string
  }>
  params: Promise<{ locale: string }>
}) {
  return (
    <div className='min-h-screen'>
      <div className='bg-gradient-hero py-12'>
        <div className='mx-auto max-w-7xl px-4'>
          <Suspense fallback={<div className='mb-6 h-9 w-80 animate-pulse rounded bg-white/20' />}>
            <BuyHeader params={params} />
          </Suspense>
        </div>
      </div>
      <div className='mx-auto max-w-7xl px-4 py-8'>
        <div className='gap-8 lg:grid lg:grid-cols-[280px_1fr]'>
          <aside className='lg:sticky lg:top-20 lg:h-fit'>
            <PropertyFilters listingType='SALE' />
          </aside>
          <main>
            <Suspense fallback={<PropertiesGridSkeleton />}>
              <BuyContent searchParams={searchParams} params={params} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}

async function BuyHeader({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'search' })
  return <h1 className='text-3xl font-bold text-white'>{t('buyTitle')}</h1>
}

async function BuyContent({
  searchParams,
  params,
}: {
  searchParams: Promise<{
    q?: string
    type?: string
    priceRange?: string
    bedrooms?: string
    bathrooms?: string
    furnished?: string
    sortBy?: string
    page?: string
  }>
  params: Promise<{ locale: string }>
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  const query: Partial<PropertySearchQuery> = {
    listingType: 'SALE',
  }

  if (resolvedSearchParams.type && resolvedSearchParams.type !== 'any') {
    query.propertyType =
      resolvedSearchParams.type.toUpperCase() as PropertySearchQuery['propertyType']
  }

  if (resolvedSearchParams.q) {
    query.keyword = resolvedSearchParams.q
  }

  if (resolvedSearchParams.priceRange && resolvedSearchParams.priceRange !== 'any') {
    const [min, max] = resolvedSearchParams.priceRange.split('-').map(Number)
    query.minPrice = min
    query.maxPrice = max
  }

  if (resolvedSearchParams.bedrooms && resolvedSearchParams.bedrooms !== 'any') {
    query.bedrooms = parseInt(resolvedSearchParams.bedrooms)
  }

  if (resolvedSearchParams.bathrooms && resolvedSearchParams.bathrooms !== 'any') {
    query.bathrooms = parseInt(resolvedSearchParams.bathrooms)
  }

  if (resolvedSearchParams.furnished === 'true') {
    query.furnished = true
  }

  if (resolvedSearchParams.sortBy) {
    query.sortBy = resolvedSearchParams.sortBy as PropertySearchQuery['sortBy']
  }

  const page = parseInt(resolvedSearchParams.page || '1')
  const result = await searchProperties({ ...query, page, limit: 12 })
  const t = await getTranslations('search')

  if (result.data.length === 0) {
    return (
      <div className='text-center py-12'>
        <NoResults />
      </div>
    )
  }

  return (
    <div>
      <div className='mb-6 flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {t('propertiesFound', { count: result.meta.total })}
        </p>
      </div>
      <PropertiesGridClient properties={result.data} />
      {result.meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={result.meta.totalPages} searchParams={resolvedSearchParams as Record<string, string>} />
      )}
    </div>
  )
}

async function NoResults() {
  const t = await getTranslations('search')
  return <p className='text-muted-foreground'>{t('noResults')}</p>
}

function PropertiesGridSkeleton() {
  return (
    <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  )
}

function Pagination({ currentPage, totalPages, searchParams }: { currentPage: number; totalPages: number; searchParams: Record<string, string> }) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    return `/buy?${params.toString()}`
  }

  return (
    <div className='mt-8 flex justify-center gap-2'>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <a
          key={page}
          href={createPageUrl(page)}
          className={`px-4 py-2 rounded ${
            currentPage === page
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          {page}
        </a>
      ))}
    </div>
  )
}
