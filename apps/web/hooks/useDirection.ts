'use client'

import { useLocale } from 'next-intl'

export type Direction = 'ltr' | 'rtl'

export function useDirection(): Direction {
  const locale = useLocale()
  return locale === 'ar' ? 'rtl' : 'ltr'
}
