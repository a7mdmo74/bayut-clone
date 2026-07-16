import { PublicFooter, PublicNav } from '@/components/PublicNav'
import { requireSession } from '@/lib/auth/requireRole'

export default async function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Any authenticated user can use the buyer dashboard (favorites, viewings, etc.)
  const user = await requireSession()

  return (
    <>
      <PublicNav user={user} />
      {children}
      <PublicFooter />
    </>
  )
}
