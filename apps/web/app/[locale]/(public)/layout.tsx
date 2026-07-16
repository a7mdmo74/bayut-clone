import { PublicFooter, PublicNav } from '@/components/PublicNav'
import { getSession } from '@/lib/auth/session'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()

  return (
    <>
      <PublicNav user={user} />
      {children}
      <PublicFooter />
    </>
  )
}
