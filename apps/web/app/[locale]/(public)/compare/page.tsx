'use client'

import { useCompare } from '@/components/CompareProvider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { X, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

const fmt = (n: number | null) =>
  n != null ? new Intl.NumberFormat('en-AE').format(n) : '—'

const rows: { label: string; key: keyof ReturnType<typeof useCompare>['items'][number]; format?: (v: any) => string }[] = [
  { label: 'Price', key: 'price', format: (v: number) => `AED ${fmt(v)}` },
  { label: 'Type', key: 'propertyType', format: (v: string) => v },
  { label: 'Listing', key: 'listingType', format: (v: string) => v === 'SALE' ? 'For Sale' : 'For Rent' },
  { label: 'Bedrooms', key: 'bedrooms', format: (v: number | null) => v != null ? String(v) : '—' },
  { label: 'Bathrooms', key: 'bathrooms', format: (v: number | null) => v != null ? String(v) : '—' },
  { label: 'Area', key: 'areaSqft', format: (v: number | null) => v != null ? `${fmt(v)} sq ft` : '—' },
  { label: 'Community', key: 'community', format: (v: any) => v ? `${v.name}, ${v.emirate}` : '—' },
]

export default function ComparePage() {
  const t = useTranslations('compare')
  const { items, remove, clear } = useCompare()

  if (items.length === 0) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center px-4 text-center'>
        <h1 className='text-2xl font-bold mb-2'>{t('title')}</h1>
        <p className='text-muted-foreground mb-6'>{t('empty')}</p>
        <Button render={<Link href='/buy' />}>{t('browseProperties')}</Button>
      </div>
    )
  }

  return (
    <div className='min-h-screen mx-auto max-w-7xl px-4 py-10'>
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='sm' render={<Link href='/buy' />}>
            <ArrowLeft className='h-4 w-4 me-1' />
            {t('back')}
          </Button>
          <h1 className='text-2xl font-bold'>{t('title')}</h1>
        </div>
        <Button variant='outline' size='sm' onClick={clear}>{t('clearAll')}</Button>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr>
              <th className='p-3 text-left text-sm font-medium text-muted-foreground w-36'>{t('feature')}</th>
              {items.map(property => (
                <th key={property.id} className='p-3 text-center min-w-[220px]'>
                  <div className='relative mx-auto mb-3 aspect-video w-full max-w-[200px] rounded-lg overflow-hidden bg-muted'>
                    <Image
                      src={property.images[0] || '/placeholder-property.jpg'}
                      alt={property.title}
                      fill
                      className='object-cover'
                    />
                    <button
                      onClick={() => remove(property.id)}
                      className='absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </div>
                  <Link href={`/properties/${property.slug}`} className='text-sm font-semibold hover:underline'>
                    {property.title}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className='border-t border-border'>
                <td className='p-3 text-sm font-medium text-muted-foreground'>{row.label}</td>
                {items.map(property => (
                  <td key={property.id} className='p-3 text-center text-sm'>
                    {row.format ? row.format((property as any)[row.key]) : String((property as any)[row.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            <tr className='border-t border-border'>
              <td className='p-3'></td>
              {items.map(property => (
                <td key={property.id} className='p-3 text-center'>
                  <Button size='sm' render={<Link href={`/properties/${property.slug}`} />}>
                    {t('viewDetails')}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {items.length < 4 && (
        <p className='mt-6 text-center text-sm text-muted-foreground'>
          {t('canAdd', { count: 4 - items.length })}
        </p>
      )}
    </div>
  )
}
