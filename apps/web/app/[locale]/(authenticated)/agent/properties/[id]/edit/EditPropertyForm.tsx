'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { PropertyDTO, ListingType, PropertyType, RentFrequency } from '@repo/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Link } from '@/i18n/navigation'

const PROPERTY_TYPES: PropertyType[] = [
  'APARTMENT', 'VILLA', 'TOWNHOUSE', 'PENTHOUSE', 'STUDIO',
  'OFFICE', 'RETAIL', 'WAREHOUSE', 'LAND', 'BUILDING',
]

const RENT_FREQUENCIES: RentFrequency[] = ['MONTHLY', 'QUARTERLY', 'YEARLY']

interface EditPropertyFormProps {
  property: PropertyDTO
}

export function EditPropertyForm({ property }: EditPropertyFormProps) {
  const t = useTranslations('agentPropertyForm')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    listingType: property.listingType,
    price: String(property.price),
    rentFrequency: (property.rentFrequency ?? 'YEARLY') as RentFrequency,
    bedrooms: String(property.bedrooms ?? 0),
    bathrooms: String(property.bathrooms ?? 0),
    areaSqft: property.areaSqft ? String(property.areaSqft) : '',
    furnished: false,
  })

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      propertyType: form.propertyType,
      listingType: form.listingType,
      price: Number(form.price),
      rentFrequency: form.listingType === 'RENT' ? form.rentFrequency : undefined,
      bedrooms: form.bedrooms === '' ? undefined : Number(form.bedrooms),
      bathrooms: form.bathrooms === '' ? undefined : Number(form.bathrooms),
      areaSqft: form.areaSqft === '' ? undefined : Number(form.areaSqft),
      furnished: form.furnished,
    }

    try {
      const res = await fetch(`/api/backend/properties/${property.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }

      toast.success(t('updateSuccess') ?? 'Property updated successfully')
      router.push('/agent/properties')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Card className='space-y-4 p-6'>
        <div>
          <h2 className='text-lg font-semibold'>{t('basics')}</h2>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='title'>{t('title')}</Label>
          <Input
            id='title'
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder={t('titlePlaceholder')}
            disabled={loading}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description'>{t('description')}</Label>
          <Textarea
            id='description'
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={5}
            disabled={loading}
          />
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>{t('propertyType')}</Label>
            <Select
              value={form.propertyType}
              onValueChange={value => updateField('propertyType', (value || 'APARTMENT') as PropertyType)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {t(`types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>{t('listingType')}</Label>
            <Select
              value={form.listingType}
              onValueChange={value => updateField('listingType', (value || 'SALE') as ListingType)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='SALE'>{t('sale')}</SelectItem>
                <SelectItem value='RENT'>{t('rent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className='space-y-4 p-6'>
        <div>
          <h2 className='text-lg font-semibold'>{t('pricing')}</h2>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='price'>{t('price')}</Label>
            <Input
              id='price'
              type='number'
              min={1}
              step='1'
              value={form.price}
              onChange={e => updateField('price', e.target.value)}
              placeholder='1500000'
              disabled={loading}
            />
          </div>

          {form.listingType === 'RENT' && (
            <div className='space-y-2'>
              <Label>{t('rentFrequency')}</Label>
              <Select
                value={form.rentFrequency}
                onValueChange={value =>
                  updateField('rentFrequency', (value || 'YEARLY') as RentFrequency)
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RENT_FREQUENCIES.map(freq => (
                    <SelectItem key={freq} value={freq}>
                      {t(`frequencies.${freq}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='space-y-2'>
            <Label htmlFor='bedrooms'>{t('bedrooms')}</Label>
            <Input
              id='bedrooms'
              type='number'
              min={0}
              value={form.bedrooms}
              onChange={e => updateField('bedrooms', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='bathrooms'>{t('bathrooms')}</Label>
            <Input
              id='bathrooms'
              type='number'
              min={0}
              value={form.bathrooms}
              onChange={e => updateField('bathrooms', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='areaSqft'>{t('areaSqft')}</Label>
            <Input
              id='areaSqft'
              type='number'
              min={1}
              value={form.areaSqft}
              onChange={e => updateField('areaSqft', e.target.value)}
              placeholder='1200'
              disabled={loading}
            />
          </div>
        </div>

        <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
          <div>
            <p className='text-sm font-medium'>{t('furnished')}</p>
            <p className='text-xs text-muted-foreground'>{t('furnishedHint')}</p>
          </div>
          <Switch
            checked={form.furnished}
            onCheckedChange={checked => updateField('furnished', checked)}
            disabled={loading}
          />
        </div>
      </Card>

      <div className='flex flex-wrap items-center gap-3'>
        <Button type='submit' disabled={loading}>
          {loading ? t('saving') : (t('update') ?? 'Update Property')}
        </Button>
        <Button type='button' variant='outline' render={<Link href='/agent/properties' />}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
