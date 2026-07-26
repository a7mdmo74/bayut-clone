// components/property/PropertyDetailsView.tsx
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import type { PropertyDTO } from '@repo/types'
import { MortgageCalculator } from '@/components/property/MortgageCalculator'
import { Label } from '@/components/ui/label'
import RequestViewingButton from '@/components/property/RequestViewingButton'
import { ReservePropertyButton } from '@/components/property/ReservePropertyButton'
import { usePathname, useRouter } from '@/i18n/navigation'
import { addFavorite, FavoriteError, getUserFavorites, removeFavorite } from '@/lib/api/user'
import { cn } from '@/lib/utils'

interface PropertyDetailsViewProps {
  property: PropertyDTO
}

export default function PropertyDetailsView({ property }: PropertyDetailsViewProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(true)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const propertyText = useTranslations('property')
  const searchText = useTranslations('search')

  useEffect(() => {
    async function loadFavoriteState() {
      try {
        const response = await getUserFavorites()
        if (response?.data) {
          setIsFavorited(response.data.some(favorite => favorite.propertyId === property.id))
        }
      } catch (error) {
        console.error('Failed to load favorite state:', error)
      } finally {
        setIsFavoriteLoading(false)
      }
    }

    loadFavoriteState()
  }, [property.id])

  async function handleFavoriteToggle() {
    if (isTogglingFavorite) return

    setIsTogglingFavorite(true)
    const nextFavorite = !isFavorited

    try {
      if (isFavorited) {
        await removeFavorite(property.id)
      } else {
        await addFavorite(property.id)
      }

      setIsFavorited(nextFavorite)
      router.refresh()
    } catch (error) {
      if (error instanceof FavoriteError && error.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  const images =
    property.images && property.images.length > 0
      ? property.images
      : ['/properties/placeholder.svg']

  const formattedPrice = new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(property.price)

  const priceLabel =
    property.listingType === 'RENT'
      ? `${formattedPrice} ${propertyText('perYear')}`
      : formattedPrice

  return (
    <div className='max-w-6xl mx-auto px-4 py-8'>
      {/* Image Gallery */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-2 mb-6'>
        <div className='md:col-span-3 relative aspect-video rounded-xl overflow-hidden bg-muted'>
          <Image
            src={images[activeImage] || '/properties/placeholder.svg'}
            alt={property.title}
            fill
            className='object-cover'
            priority
            onError={(e) => {
              const img = e.target as HTMLImageElement
              img.src = '/properties/placeholder.svg'
            }}
          />
          <button
            type='button'
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading || isTogglingFavorite}
            className='cursor-pointer absolute top-4 end-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-md transition hover:bg-background disabled:opacity-50'
            aria-label={propertyText('favorite')}
            aria-pressed={isFavorited}
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-colors',
                isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              )}
            />
          </button>
        </div>

        <div className='md:col-span-1 grid grid-cols-4 md:grid-cols-1 gap-2 max-h-[26.25rem] overflow-hidden'>
          {images.slice(0, 4).map((img, i) => (
            <button
              key={i}
              type='button'
              onClick={() => setActiveImage(i)}
              aria-label={`${property.title} ${i + 1}`}
              aria-current={activeImage === i ? 'true' : undefined}
              className={`cursor-pointer relative aspect-video md:aspect-square rounded-lg overflow-hidden border-2 transition ${
                activeImage === i ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Image src={img || '/properties/placeholder.svg'} alt={`${property.title} ${i + 1}`} fill className='object-cover' onError={(e) => {
                const imgEl = e.target as HTMLImageElement
                imgEl.src = '/properties/placeholder.svg'
              }} />
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main content */}
        <div className='lg:col-span-2'>
          <div className='flex items-start justify-between mb-2'>
            <div>
              <span className='inline-block text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary mb-2'>
                {property.listingType === 'SALE'
                  ? propertyText('forSale')
                  : propertyText('forRent')}
              </span>
              <h1 className='text-2xl md:text-3xl font-semibold text-foreground'>
                {property.title}
              </h1>
              <p className='text-muted-foreground mt-1'>
                {property.community
                  ? `${property.community.name}, ${property.community.emirate}`
                  : propertyText('locationMissing')}
              </p>
            </div>
          </div>

          <p className='text-2xl font-bold text-primary mt-4'>{priceLabel}</p>

          {/* Key details bar */}
          <div className='flex flex-wrap gap-6 border-y border-border py-4 my-6'>
            <DetailStat label={propertyText('bedrooms')} value={property.bedrooms ?? '—'} />
            <DetailStat label={propertyText('bathrooms')} value={property.bathrooms ?? '—'} />
            <DetailStat
              label={propertyText('area')}
              value={property.areaSqft ? `${property.areaSqft} ${propertyText('sqft')}` : '—'}
            />
            <DetailStat
              label={propertyText('type')}
              value={translateType(property.propertyType, searchText)}
            />
          </div>

          <section className='mb-8'>
            <h2 className='text-lg font-semibold text-foreground mb-2'>
              {propertyText('description')}
            </h2>
            <p className='text-muted-foreground leading-relaxed whitespace-pre-line'>
              {property.description}
            </p>
          </section>
        </div>

        {/* Sidebar - contact form */}
        <div className='lg:col-span-1 space-y-4'>
          <div className='border border-border rounded-xl p-5 space-y-3'>
            <RequestViewingButton propertyId={property.id} />
            {property.listingType === 'SALE' && <ReservePropertyButton propertyId={property.id} />}
          </div>
          <div className='border border-border rounded-xl p-5'>
            <h3 className='font-semibold text-foreground mb-4'>{propertyText('interested')}</h3>
            <ContactForm propertyId={property.id} />
          </div>
          {property.listingType === 'SALE' && <MortgageCalculator price={property.price} />}
        </div>
      </div>
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className='text-lg font-semibold text-foreground'>{value}</p>
      <p className='text-sm text-muted-foreground'>{label}</p>
    </div>
  )
}

function formatEnum(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function translateType(
  value: string,
  t: (key: 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'studio' | 'office') => string
) {
  const key = value.toLowerCase()
  if (
    key === 'apartment' ||
    key === 'villa' ||
    key === 'townhouse' ||
    key === 'penthouse' ||
    key === 'studio' ||
    key === 'office'
  ) {
    return t(key)
  }

  return formatEnum(value)
}

function ContactForm({ propertyId }: { propertyId: string }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('property')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      propertyId,
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || t('sendError'))
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendError'))
      console.error('Failed to submit lead:', err)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return <p className='text-sm text-primary bg-primary/10 rounded-lg p-3'>{t('inquirySent')}</p>
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <div>
        <Label htmlFor='contact-name' className='sr-only'>
          {t('yourName')}
        </Label>
        <input
          id='contact-name'
          name='name'
          placeholder={t('yourName')}
          required
          className='w-full border border-input rounded-lg px-3 py-2 text-sm bg-background'
        />
      </div>
      <div>
        <Label htmlFor='contact-email' className='sr-only'>
          {t('email')}
        </Label>
        <input
          id='contact-email'
          name='email'
          type='email'
          placeholder={t('email')}
          required
          className='w-full border border-input rounded-lg px-3 py-2 text-sm bg-background'
        />
      </div>
      <div>
        <Label htmlFor='contact-phone' className='sr-only'>
          {t('phone')}
        </Label>
        <input
          id='contact-phone'
          name='phone'
          type='tel'
          placeholder={t('phone')}
          required
          className='w-full border border-input rounded-lg px-3 py-2 text-sm bg-background'
        />
      </div>
      <div>
        <Label htmlFor='contact-message' className='sr-only'>
          {t('message')}
        </Label>
        <textarea
          id='contact-message'
          name='message'
          placeholder={t('message')}
          rows={3}
          className='w-full border border-input rounded-lg px-3 py-2 text-sm bg-background'
        />
      </div>
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      <button
        type='submit'
        disabled={loading}
        className='w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50'
      >
        {loading ? t('sending') : t('send')}
      </button>
    </form>
  )
}
