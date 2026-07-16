import { setRequestLocale, getTranslations } from 'next-intl/server'
import { PropertyForm } from '@/components/property/PropertyForm'
import { Link } from '@/i18n/navigation'

export default async function NewPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('agentPropertyForm')

  return (
    <div className='mx-auto max-w-3xl px-4 py-10'>
      <div className='mb-8'>
        <p className='text-sm text-muted-foreground'>
          <Link href='/agent/properties' className='hover:text-foreground hover:underline'>
            {t('backToProperties')}
          </Link>
        </p>
        <h1 className='mt-2 text-2xl font-bold'>{t('pageTitle')}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{t('pageDescription')}</p>
      </div>
      <PropertyForm />
    </div>
  )
}
