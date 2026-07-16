'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal, Bookmark, X, MapPin, Home, BedDouble, Bath } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ListingType } from '@repo/types'


function SearchInput({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  return (
    <Input
      id={id}
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
      onKeyDown={e => { if (e.key === 'Enter') onChange(localValue) }}
      placeholder={placeholder}
      className='h-9 text-sm'
    />
  )
}

interface PropertyFiltersProps {
  listingType: ListingType
}

export function PropertyFilters({ listingType }: PropertyFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('search')

  const [mobileOpen, setMobileOpen] = useState(false)

  const keyword = searchParams.get('q') || ''
  const propertyType = searchParams.get('type') || 'any'
  const priceRange = searchParams.get('priceRange') || 'any'
  const bedrooms = searchParams.get('bedrooms') || 'any'
  const bathrooms = searchParams.get('bathrooms') || 'any'
  const furnished = searchParams.get('furnished') === 'true'
  const sortBy = searchParams.get('sortBy') || 'newest'

  const [localKeyword, setLocalKeyword] = useState(keyword)
  const [localPropertyType, setLocalPropertyType] = useState(propertyType)
  const [localPriceRange, setLocalPriceRange] = useState(priceRange)
  const [localBedrooms, setLocalBedrooms] = useState(bedrooms)
  const [localBathrooms, setLocalBathrooms] = useState(bathrooms)
  const [localFurnished, setLocalFurnished] = useState(furnished)
  const [localSortBy, setLocalSortBy] = useState(sortBy)

  useEffect(() => {
    setLocalKeyword(keyword)
    setLocalPropertyType(propertyType)
    setLocalPriceRange(priceRange)
    setLocalBedrooms(bedrooms)
    setLocalBathrooms(bathrooms)
    setLocalFurnished(furnished)
    setLocalSortBy(sortBy)
  }, [keyword, propertyType, priceRange, bedrooms, bathrooms, furnished, sortBy])

  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'any') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    params.delete('page')
    const queryString = params.toString()
    router.push(
      `${listingType === 'SALE' ? '/buy' : '/rent'}${queryString ? `?${queryString}` : ''}`
    )
  }

  const applyFilters = () => {
    updateURL({
      q: localKeyword || null,
      type: localPropertyType === 'any' ? null : localPropertyType,
      priceRange: localPriceRange === 'any' ? null : localPriceRange,
      bedrooms: localBedrooms === 'any' ? null : localBedrooms,
      bathrooms: localBathrooms === 'any' ? null : localBathrooms,
      furnished: localFurnished ? 'true' : null,
      sortBy: localSortBy === 'newest' ? null : localSortBy,
    })
    setMobileOpen(false)
  }

  const resetFilters = () => {
    setLocalKeyword('')
    setLocalPropertyType('any')
    setLocalPriceRange('any')
    setLocalBedrooms('any')
    setLocalBathrooms('any')
    setLocalFurnished(false)
    setLocalSortBy('newest')
    const basePath = listingType === 'SALE' ? '/buy' : '/rent'; router.replace(basePath); router.refresh()
    setMobileOpen(false)
  }

  const hasActiveFilters =
    keyword ||
    propertyType !== 'any' ||
    priceRange !== 'any' ||
    bedrooms !== 'any' ||
    bathrooms !== 'any' ||
    furnished

  const activeCount = [
    keyword ? 1 : 0,
    propertyType !== 'any' ? 1 : 0,
    priceRange !== 'any' ? 1 : 0,
    bedrooms !== 'any' ? 1 : 0,
    bathrooms !== 'any' ? 1 : 0,
    furnished ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const priceRanges =
    listingType === 'SALE'
      ? [
          { value: 'any', label: t('anyPrice') },
          { value: '0-500000', label: t('upTo', { price: '500K' }) },
          { value: '500000-1500000', label: '500K – 1.5M' },
          { value: '1500000-4000000', label: '1.5M – 4M' },
          { value: '4000000-999999999', label: '4M+' },
        ]
      : [
          { value: 'any', label: t('anyPrice') },
          { value: '0-30000', label: t('upTo', { price: '30K' }) },
          { value: '30000-75000', label: '30K – 75K' },
          { value: '75000-150000', label: '75K – 150K' },
          { value: '150000-999999999', label: '150K+' },
        ]

  const bedroomOptions = ['any', '0', '1', '2', '3', '4', '5']
  const bathroomOptions = ['any', '1', '2', '3', '4', '5']

  const FilterContent = () => (
    <div className='space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-semibold uppercase tracking-wide text-foreground'>{t('filters')}</h3>
          {activeCount > 0 && (
            <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground'>
              {activeCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type='button'
            onClick={resetFilters}
            className='text-xs text-muted-foreground hover:text-foreground transition-colors'
          >
            {t('clear')}
          </button>
        )}
      </div>

      {/* Location */}
      <div className='space-y-1.5'>
        <Label htmlFor='keyword' className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
          <MapPin className='h-3 w-3' />
          {t('location')}
        </Label>
        <div className='relative'>
          <SearchInput
            id='keyword'
            value={localKeyword}
            onChange={setLocalKeyword}
            placeholder={t('locationPlaceholder')}
          />
        </div>
      </div>

      {/* Property Type */}
      <div className='space-y-1.5'>
        <Label htmlFor='propertyType' className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
          <Home className='h-3 w-3' />
          {t('propertyType')}
        </Label>
        <Select value={localPropertyType} onValueChange={v => setLocalPropertyType(v ?? 'any')}>
          <SelectTrigger id='propertyType' className='w-full h-9 text-sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='any'>{t('anyType')}</SelectItem>
            <SelectItem value='Apartment'>{t('apartment')}</SelectItem>
            <SelectItem value='Villa'>{t('villa')}</SelectItem>
            <SelectItem value='Townhouse'>{t('townhouse')}</SelectItem>
            <SelectItem value='Penthouse'>{t('penthouse')}</SelectItem>
            <SelectItem value='Studio'>{t('studio')}</SelectItem>
            <SelectItem value='Office'>{t('office')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className='space-y-1.5'>
        <Label htmlFor='priceRange' className='text-xs font-medium text-muted-foreground'>
          {t('price')}
        </Label>
        <Select value={localPriceRange} onValueChange={v => setLocalPriceRange(v ?? 'any')}>
          <SelectTrigger id='priceRange' className='w-full h-9 text-sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map(range => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms */}
      <div className='space-y-1.5'>
        <Label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
          <BedDouble className='h-3 w-3' />
          {t('bedrooms')}
        </Label>
        <div className='flex flex-wrap gap-1.5'>
          {bedroomOptions.map(opt => (
            <button
              key={opt}
              type='button'
              onClick={() => setLocalBedrooms(opt)}
              className={cn(
                'inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-all',
                localBedrooms === opt
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
              )}
            >
              {opt === 'any' ? t('any') : opt === '0' ? t('studio') : `${opt}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div className='space-y-1.5'>
        <Label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
          <Bath className='h-3 w-3' />
          {t('bathrooms')}
        </Label>
        <div className='flex flex-wrap gap-1.5'>
          {bathroomOptions.map(opt => (
            <button
              key={opt}
              type='button'
              onClick={() => setLocalBathrooms(opt)}
              className={cn(
                'inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-all',
                localBathrooms === opt
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
              )}
            >
              {opt === 'any' ? t('any') : `${opt}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Furnished */}
      <div className='flex items-center justify-between rounded-lg border border-border px-3 py-2'>
        <Label htmlFor='furnished' className='text-sm font-medium cursor-pointer'>
          {t('furnished')}
        </Label>
        <Switch id='furnished' checked={localFurnished} onCheckedChange={setLocalFurnished} />
      </div>

      {/* Sort By */}
      <div className='space-y-1.5'>
        <Label htmlFor='sortBy' className='text-xs font-medium text-muted-foreground'>
          {t('sortBy')}
        </Label>
        <Select value={localSortBy} onValueChange={v => setLocalSortBy(v ?? 'newest')}>
          <SelectTrigger id='sortBy' className='w-full h-9 text-sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>{t('newest')}</SelectItem>
            <SelectItem value='price_asc'>{t('priceLowToHigh')}</SelectItem>
            <SelectItem value='price_desc'>{t('priceHighToLow')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Divider */}
      <div className='border-t border-border' />

      {/* Actions */}
      <div className='space-y-2'>
        <Button className='w-full h-9' onClick={applyFilters}>
          {t('applyFilters')}
        </Button>
        {hasActiveFilters && (
          <SaveSearchButton
            listingType={listingType}
            filters={{
              q: localKeyword || undefined,
              type: localPropertyType !== 'any' ? localPropertyType : undefined,
              priceRange: localPriceRange !== 'any' ? localPriceRange : undefined,
              bedrooms: localBedrooms !== 'any' ? localBedrooms : undefined,
              bathrooms: localBathrooms !== 'any' ? localBathrooms : undefined,
              furnished: localFurnished ? 'true' : undefined,
              sortBy: localSortBy !== 'newest' ? localSortBy : undefined,
            }}
          />
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Filter Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          className='w-full lg:hidden'
          aria-label={t('filters')}
          render={<Button variant='outline' className='w-full lg:hidden' />}
        >
          <SlidersHorizontal className='h-4 w-4 me-2' />
          {t('filters')}
          {activeCount > 0 && (
            <span className='ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground'>
              {activeCount}
            </span>
          )}
        </SheetTrigger>
        <SheetContent side='bottom' className='h-[85vh] overflow-y-auto'>
          <FilterContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className='hidden lg:block rounded-xl border border-border bg-card p-5 shadow-sm'>
        <FilterContent />
      </div>
    </>
  )
}

interface SaveSearchButtonProps {
  listingType: ListingType
  filters: Record<string, string | undefined>
}

function SaveSearchButton({ listingType, filters }: SaveSearchButtonProps) {
  const t = useTranslations('search')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const name = prompt(t('saveSearchPrompt') ?? 'Name this search:')
    if (!name) return

    setSaving(true)
    try {
      const res = await fetch('/api/backend/saved-searches', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          filters: { ...filters, listingType },
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      toast.success(t('saveSearchSuccess') ?? 'Search saved!')
    } catch {
      toast.error(t('saveSearchFailed') ?? 'Failed to save search')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Button variant='outline' size='sm' className='w-full h-8' onClick={handleSave} disabled={saving}>
      <Bookmark className='h-3.5 w-3.5 me-1.5' />
      {saving ? '…' : (t('saveSearch') ?? 'Save search')}
    </Button>
  )
}
