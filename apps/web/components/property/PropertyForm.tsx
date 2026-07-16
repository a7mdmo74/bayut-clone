'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  createPropertySchema,
  type AmenityDTO,
  type CommunityDTO,
  type CreatePropertyInput,
  type EmirateDTO,
  type ListingType,
  type PropertyDTO,
  type PropertyType,
  type RentFrequency,
} from '@repo/types'
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
  'APARTMENT',
  'VILLA',
  'TOWNHOUSE',
  'PENTHOUSE',
  'STUDIO',
  'OFFICE',
  'RETAIL',
  'WAREHOUSE',
  'LAND',
  'BUILDING',
]

const RENT_FREQUENCIES: RentFrequency[] = ['MONTHLY', 'QUARTERLY', 'YEARLY']

async function apiJson<T>(path: string, options?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/backend${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        ok: false,
        error:
          (data && typeof data.error === 'string' && data.error) ||
          'Request failed',
      }
    }
    return { ok: true, data: data as T }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

export function PropertyForm() {
  const t = useTranslations('agentPropertyForm')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emirates, setEmirates] = useState<EmirateDTO[]>([])
  const [communities, setCommunities] = useState<CommunityDTO[]>([])
  const [amenities, setAmenities] = useState<AmenityDTO[]>([])
  const [emirateId, setEmirateId] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyType: 'APARTMENT' as PropertyType,
    listingType: 'SALE' as ListingType,
    price: '',
    rentFrequency: 'YEARLY' as RentFrequency,
    bedrooms: '2',
    bathrooms: '2',
    areaSqft: '',
    furnished: false,
    communityId: '',
    addressLine: '',
    amenityIds: [] as string[],
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  useEffect(() => {
    async function loadLookups() {
      const [emiratesResult, amenitiesResult] = await Promise.all([
        apiJson<EmirateDTO[]>('/locations/emirates'),
        apiJson<AmenityDTO[]>('/amenities'),
      ])
      if (emiratesResult.ok) setEmirates(emiratesResult.data)
      if (amenitiesResult.ok) setAmenities(amenitiesResult.data)
    }
    loadLookups()
  }, [])

  useEffect(() => {
    if (!emirateId) {
      setCommunities([])
      setForm(prev => ({ ...prev, communityId: '' }))
      return
    }

    async function loadCommunities() {
      const result = await apiJson<CommunityDTO[]>(`/locations/emirates/${emirateId}/communities`)
      if (result.ok) {
        setCommunities(result.data)
      } else {
        setCommunities([])
      }
      setForm(prev => ({ ...prev, communityId: '' }))
    }
    loadCommunities()
  }, [emirateId])

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function toggleAmenity(id: string) {
    setForm(prev => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(id)
        ? prev.amenityIds.filter(a => a !== id)
        : [...prev.amenityIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const payload: CreatePropertyInput = {
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
      communityId: form.communityId || undefined,
      addressLine: form.addressLine.trim() || undefined,
      amenityIds: form.amenityIds.length > 0 ? form.amenityIds : undefined,
    }

    const validated = createPropertySchema.safeParse(payload)
    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, messages]) => [
            key,
            messages?.[0] || t('invalidField'),
          ])
        )
      )
      setLoading(false)
      return
    }

    const result = await apiJson<PropertyDTO>('/properties', {
      method: 'POST',
      body: JSON.stringify(validated.data),
    })

    if (!result.ok) {
      setLoading(false)
      toast.error(result.error === 'Validation failed' ? t('validationFailed') : result.error)
      return
    }

    // Attach uploaded images to the created property
    if (uploadedImages.length > 0) {
      for (let i = 0; i < uploadedImages.length; i++) {
        await apiJson(`/properties/${result.data.id}/images`, {
          method: 'POST',
          body: JSON.stringify({ url: uploadedImages[i], isCover: i === 0 }),
        })
      }
    }

    setLoading(false)
    toast.success(t('createSuccess'))
    router.push('/agent/properties')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Card className='space-y-4 p-6'>
        <div>
          <h2 className='text-lg font-semibold'>{t('basics')}</h2>
          <p className='text-sm text-muted-foreground'>{t('basicsHint')}</p>
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
          {errors.title && <p className='text-sm text-destructive'>{errors.title}</p>}
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
          {errors.description && (
            <p className='text-sm text-destructive'>{errors.description}</p>
          )}
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
            {errors.price && <p className='text-sm text-destructive'>{errors.price}</p>}
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
              {errors.rentFrequency && (
                <p className='text-sm text-destructive'>{errors.rentFrequency}</p>
              )}
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

      <Card className='space-y-4 p-6'>
        <div>
          <h2 className='text-lg font-semibold'>{t('location')}</h2>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>{t('emirate')}</Label>
            <Select value={emirateId || undefined} onValueChange={value => setEmirateId(value || '')}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={t('selectEmirate')} />
              </SelectTrigger>
              <SelectContent>
                {emirates.map(emirate => (
                  <SelectItem key={emirate.id} value={emirate.id}>
                    {emirate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>{t('community')}</Label>
            <Select
              value={form.communityId || undefined}
              onValueChange={value => updateField('communityId', value || '')}
              disabled={!emirateId || communities.length === 0}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={t('selectCommunity')} />
              </SelectTrigger>
              <SelectContent>
                {communities.map(community => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='addressLine'>{t('address')}</Label>
          <Input
            id='addressLine'
            value={form.addressLine}
            onChange={e => updateField('addressLine', e.target.value)}
            placeholder={t('addressPlaceholder')}
            disabled={loading}
          />
        </div>
      </Card>

      {amenities.length > 0 && (
        <Card className='space-y-4 p-6'>
          <div>
            <h2 className='text-lg font-semibold'>{t('amenities')}</h2>
            <p className='text-sm text-muted-foreground'>{t('amenitiesHint')}</p>
          </div>
          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
            {amenities.map(amenity => {
              const checked = form.amenityIds.includes(amenity.id)
              return (
                <label
                  key={amenity.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type='checkbox'
                    className='size-4 accent-primary'
                    checked={checked}
                    onChange={() => toggleAmenity(amenity.id)}
                    disabled={loading}
                  />
                  {amenity.name}
                </label>
              )
            })}
          </div>
        </Card>
      )}

      <ImageUploadSection
        propertyId={null}
        onImagesUploaded={urls => setUploadedImages(urls)}
        disabled={loading}
      />

      <div className='flex flex-wrap items-center gap-3'>
        <Button type='submit' disabled={loading}>
          {loading ? t('saving') : t('submit')}
        </Button>
        <Button type='button' variant='outline' render={<Link href='/agent/properties' />}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}

interface ImageUploadSectionProps {
  propertyId: string | null
  onImagesUploaded: (urls: string[]) => void
  disabled?: boolean
}

function ImageUploadSection({ propertyId, onImagesUploaded, disabled }: ImageUploadSectionProps) {
  const t = useTranslations('agentPropertyForm')
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setPreviews(prev => [...prev, ...newPreviews])
    e.target.value = ''
  }

  function removePreview(index: number) {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleUpload() {
    if (previews.length === 0) return
    setUploading(true)

    const newUrls: string[] = []

    for (const preview of previews) {
      try {
        const fileType = preview.file.type as 'image/jpeg' | 'image/png' | 'image/webp'

        // Get presigned URL
        const presignRes = await fetch('/api/backend/uploads/presign', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: preview.file.name, fileType }),
        })

        if (!presignRes.ok) {
          toast.error(t('uploadFailed') ?? 'Failed to get upload URL')
          continue
        }

        const { uploadUrl, publicUrl } = await presignRes.json()

        // Upload directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: preview.file,
          headers: { 'Content-Type': fileType },
        })

        if (!uploadRes.ok) {
          toast.error(t('uploadFailed') ?? 'Failed to upload image')
          continue
        }

        newUrls.push(publicUrl)

        // If property already exists, attach image immediately
        if (propertyId) {
          const isCover = uploadedUrls.length === 0 && newUrls.length === 1
          await apiJson(`/properties/${propertyId}/images`, {
            method: 'POST',
            body: JSON.stringify({ url: publicUrl, isCover }),
          })
        }
      } catch {
        toast.error(t('uploadFailed') ?? 'Upload failed')
      }
    }

    // Cleanup previews
    previews.forEach(p => URL.revokeObjectURL(p.url))
    setPreviews([])

    const allUrls = [...uploadedUrls, ...newUrls]
    setUploadedUrls(allUrls)
    onImagesUploaded(allUrls)
    setUploading(false)
  }

  return (
    <Card className='space-y-4 p-6'>
      <div>
        <h2 className='text-lg font-semibold'>{t('photos') ?? 'Photos'}</h2>
        <p className='text-sm text-muted-foreground'>{t('photosHint') ?? 'Upload up to 20 photos. First photo will be the cover.'}</p>
      </div>

      {uploadedUrls.length > 0 && (
        <div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
          {uploadedUrls.map((url, i) => (
            <div key={url} className='relative aspect-square overflow-hidden rounded-lg border'>
              <img src={url} alt={`Uploaded ${i + 1}`} className='h-full w-full object-cover' />
              {i === 0 && (
                <span className='absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground'>
                  {t('cover') ?? 'Cover'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <>
          <div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
            {previews.map((preview, i) => (
              <div key={i} className='group relative aspect-square overflow-hidden rounded-lg border'>
                <img src={preview.url} alt={`Preview ${i + 1}`} className='h-full w-full object-cover' />
                <button
                  type='button'
                  onClick={() => removePreview(i)}
                  className='absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100'
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleUpload}
            disabled={uploading || disabled}
          >
            {uploading ? (t('uploading') ?? 'Uploading…') : (t('uploadPhotos') ?? 'Upload photos')}
          </Button>
        </>
      )}

      <div>
        <label className='flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground transition hover:bg-muted/50'>
          <input
            type='file'
            accept='image/jpeg,image/png,image/webp'
            multiple
            className='hidden'
            onChange={handleFileSelect}
            disabled={uploading || disabled}
          />
          <span>{t('addPhotos') ?? 'Click to add photos'}</span>
        </label>
      </div>
    </Card>
  )
}
