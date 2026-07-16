import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/api/server'
import type { PropertyDTO } from '@repo/types'
import { EditPropertyForm } from './EditPropertyForm'

async function getProperty(id: string): Promise<PropertyDTO | null> {
  try {
    const property = await serverFetch<PropertyDTO>(`/properties/${id}`)
    return property
  } catch {
    return null
  }
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('agentPropertyForm')

  const property = await getProperty(id)

  if (!property) {
    notFound()
  }

  return (
    <div className='mx-auto max-w-3xl px-4 py-10'>
      <div className='mb-8'>
        <p className='text-sm text-muted-foreground'>
          <Link href='/agent/properties' className='hover:text-foreground hover:underline'>
            {t('backToProperties')}
          </Link>
        </p>
        <h1 className='mt-2 text-2xl font-bold'>{t('editProperty') ?? 'Edit Property'}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{property.title}</p>
      </div>
      <EditPropertyForm property={property} />
    </div>
  )
}
