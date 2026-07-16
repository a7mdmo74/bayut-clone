import { getTranslations, setRequestLocale } from 'next-intl/server'
import ViewingsList from '@/components/viewings/ViewingsList'
import { getMyViewings } from '@/lib/api/viewings-server'

export default async function ViewingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('dashboard')

  const viewings = await getMyViewings().catch(() => [])

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='mx-auto max-w-7xl px-4 py-10'>
        <h1 className='text-2xl font-bold'>{t('viewings')}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{t('viewingsDescription')}</p>
        
        <div className='mt-8'>
          <ViewingsList initialViewings={viewings} />
        </div>
      </div>
    </div>
  )
}
