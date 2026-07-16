import { getTranslations, setRequestLocale } from 'next-intl/server'
import ViewingsList from '@/components/viewings/ViewingsList'
import { getAgentViewings } from '@/lib/api/viewings-server'

export default async function AgentViewingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('agentDashboard')
  const viewings = await getAgentViewings().catch(() => [])

  return (
    <div className='mx-auto max-w-7xl px-4 py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{t('tabs.viewings')}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Manage property viewings
          </p>
        </div>
      </div>

      <div className='mt-8'>
        <ViewingsList initialViewings={viewings} />
      </div>
    </div>
  )
}
