'use client'

import { Heart, BedDouble, Bath, Maximize, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { PropertyDTO } from '@repo/types'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { addFavorite, FavoriteError, removeFavorite } from '@/lib/api/user'

interface PropertyCardProps {
  property: PropertyDTO
  className?: string
  isFavorite?: boolean
  onFavoriteToggle?: (propertyId: string, isFavorite: boolean) => void
}

export function PropertyCard({
  property,
  className,
  isFavorite: initialFavorite = false,
  onFavoriteToggle,
}: PropertyCardProps) {
  const t = useTranslations('property')
  const format = useFormatter()
  const router = useRouter()
  const pathname = usePathname()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsFavorite(initialFavorite)
  }, [initialFavorite])

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    setIsLoading(true)
    const nextFavorite = !isFavorite

    try {
      if (isFavorite) {
        await removeFavorite(property.id)
      } else {
        await addFavorite(property.id)
      }

      setIsFavorite(nextFavorite)
      onFavoriteToggle?.(property.id, nextFavorite)
      router.refresh()
    } catch (error) {
      if (error instanceof FavoriteError && error.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const propertyHref = `/properties/${property.slug}`

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-xl bg-card shadow-card transition hover:shadow-elegant',
        className
      )}
    >
      <div className='relative aspect-4/3 overflow-hidden bg-muted'>
        <Link href={propertyHref} className='relative block h-full w-full'>
          <Image
            src={property.images[0] || '/properties/apartment-1.jpg'}
            alt={property.title}
            loading='lazy'
            className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
            fill
            sizes='(max-width:768px) 100vw, 400px'
          />
        </Link>
        <div className='absolute top-3 inset-s-3 flex gap-2'>
          <Badge variant='secondary' className='bg-background/90 backdrop-blur'>
            {property.listingType === 'RENT' ? t('forRent') : t('forSale')}
          </Badge>
        </div>
        <Button
          size='icon'
          variant='secondary'
          className='absolute top-3 end-3 z-10 h-9 w-9 rounded-full bg-background/90 backdrop-blur'
          onClick={handleFavoriteClick}
          disabled={isLoading}
          aria-label={t('favorite')}
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              isFavorite ? 'fill-red-500 text-red-500' : ''
            )}
          />
        </Button>
      </div>
      <Link href={propertyHref} className='block space-y-2 p-4'>
        <div className='flex items-baseline justify-between gap-2'>
          <div className='text-lg font-semibold tracking-tight text-foreground'>
            {format.number(property.price, {
              style: 'currency',
              currency: 'AED',
              maximumFractionDigits: 0,
            })}
            {property.listingType === 'RENT' && (
              <span className='text-sm font-normal text-muted-foreground'>{t('perYear')}</span>
            )}
          </div>
          <Badge variant='outline' className='shrink-0 text-xs'>
            {property.propertyType}
          </Badge>
        </div>
        <div className='truncate text-sm font-medium text-foreground'>{property.title}</div>
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <MapPin className='h-3 w-3 shrink-0' />
          <span className='truncate'>{property.community?.name || t('locationMissing')}</span>
        </div>
        <div className='flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground'>
          {property.bedrooms && property.bedrooms > 0 && (
            <span className='flex items-center gap-1'>
              <BedDouble className='h-4 w-4' /> {property.bedrooms}
            </span>
          )}
          <span className='flex items-center gap-1'>
            <Bath className='h-4 w-4' /> {property.bathrooms || 0}
          </span>
          <span className='flex items-center gap-1'>
            <Maximize className='h-4 w-4' /> {property.areaSqft || 0} {t('sqft')}
          </span>
        </div>
      </Link>
    </div>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className='overflow-hidden rounded-xl bg-card shadow-card'>
      <div className='aspect-4/3 animate-pulse bg-muted' />
      <div className='space-y-2 p-4'>
        <div className='h-5 w-2/3 animate-pulse rounded bg-muted' />
        <div className='h-4 w-full animate-pulse rounded bg-muted' />
        <div className='h-3 w-1/2 animate-pulse rounded bg-muted' />
      </div>
    </div>
  )
}
