import { redirect } from 'next/navigation'
import { AgentShell } from '@/components/agent/AgentShell'
import { getSession } from '@/lib/auth/session'

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.role !== 'AGENT' && session.role !== 'AGENCY_ADMIN') {
    redirect('/unauthorized')
  }

  return <AgentShell>{children}</AgentShell>
}
