import { setRequestLocale } from 'next-intl/server'
import { AgentTransactionsClient } from './AgentTransactionsClient'

export default async function AgentTransactionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AgentTransactionsClient />
}
