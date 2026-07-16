import { Link } from '@/i18n/navigation'
import { getSession } from '@/lib/auth/session'
import { getDashboardPath } from '@/lib/auth/redirects'
import { Button } from '@/components/ui/button'

export default async function UnauthorizedPage() {
  const session = await getSession()
  const dashboardPath = getDashboardPath(session?.role)

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/30 px-4 py-16'>
      <div className='w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm'>
        <h1 className='text-2xl font-semibold'>Access denied</h1>
        <p className='mt-3 text-sm text-muted-foreground'>
          You do not have permission to view this section of the app.
        </p>
        <Button className='mt-6' render={<Link href={dashboardPath} />}>
          Go to your dashboard
        </Button>
      </div>
    </div>
  )
}
