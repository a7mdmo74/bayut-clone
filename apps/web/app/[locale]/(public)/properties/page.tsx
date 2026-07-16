import { Suspense } from 'react'
import { searchProperties } from '@/lib/api/properties'
import { PropertyCardSkeleton } from '@/components/properties/PropertCard'
import { PropertiesGridClient } from '@/components/properties/PropertiesGridClient'
import { HeroSearch } from '@/components/HeroSearch'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { PropertySearchQuery } from '@repo/types'

export default function PropertiesPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ q?: string; listing?: string; type?: string; priceRange?: string }>
  params: Promise<{ locale: string }>
}) {
  return (
    <div className='min-h-screen'>
      <div className='bg-gradient-hero py-12'>
        <div className='mx-auto max-w-7xl px-4'>
          <Suspense fallback={<div className='mb-6 h-9 w-80 animate-pulse rounded bg-white/20' />}>
            <PropertiesHeader params={params} />
          </Suspense>
          <HeroSearch />
        </div>
      </div>
      <div className='mx-auto max-w-7xl px-4 py-8'>
        <Suspense fallback={<PropertiesGridSkeleton />}>
          <PropertiesContent searchParams={searchParams} params={params} />
        </Suspense>
      </div>
    </div>
  )
}

async function PropertiesHeader({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'search' })
  return <h1 className='text-3xl font-bold text-white mb-6'>{t('title')}</h1>
}

async function PropertiesContent({
  searchParams,
  params,
}: {
  searchParams: Promise<{ q?: string; listing?: string; type?: string; priceRange?: string }>
  params: Promise<{ locale: string }>
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  const query: Partial<PropertySearchQuery> = {}

  if (resolvedSearchParams.listing === 'Sale' || resolvedSearchParams.listing === 'Rent') {
    query.listingType = resolvedSearchParams.listing === 'Sale' ? 'SALE' : 'RENT'
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

  const result = await searchProperties({ ...query, page: 1, limit: 20 })

  if (result.data.length === 0) {
    return (
      <div className='text-center py-12'>
        <NoResults />
      </div>
    )
  }

  return <PropertiesGridClient properties={result.data} />
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
