import { redirect } from 'next/navigation'
import { PublicFooter, PublicNav } from '@/components/PublicNav'
import { getSession } from '@/lib/auth/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <>
      <PublicNav user={session} />
      {children}
      <PublicFooter />
    </>
  )
}
