import { setRequestLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/api/user-server'
import { AgentSettingsForm } from './AgentSettingsForm'

export const dynamic = 'force-dynamic'

export default async function AgentSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await getCurrentUser().catch(() => null)

  if (!user) {
    return null
  }

  return <AgentSettingsForm user={user} />
}
