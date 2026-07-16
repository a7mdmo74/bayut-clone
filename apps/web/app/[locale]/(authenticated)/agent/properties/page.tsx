import { Building2, Edit, Eye, Plus, Trash2 } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { type AgentProperty } from '@/lib/api/agent'
import { AgentPropertiesClient } from './AgentPropertiesClient'

export default async function AgentPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AgentPropertiesClient />
}
