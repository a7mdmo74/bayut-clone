'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')

  return (
    <button
      type='button'
      onClick={() => router.replace(pathname, { locale: locale === 'ar' ? 'en' : 'ar' })}
      className='rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'
      aria-label={t('language')}
    >
      {t('language')}
    </button>
  )
}
