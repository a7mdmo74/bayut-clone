'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')
  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='max-w-md text-center'>
        <h1 className='text-xl font-semibold tracking-tight text-foreground'>{t('unexpectedTitle')}</h1>
        <p className='mt-2 text-sm text-muted-foreground'>{t('unexpectedDescription')}</p>
        <div className='mt-6 flex flex-wrap justify-center gap-2'>
          <button
            onClick={reset}
            className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            {t('tryAgain')}
          </button>
          <Link
            href='/'
            className='inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent'
          >
            {t('home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
