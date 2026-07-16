import type { Metadata } from 'next'
import { Inter, Noto_Kufi_Arabic } from 'next/font/google'
import { hasLocale } from 'next-intl'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'
import { cn } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { Suspense } from 'react'
import { LoadingFallback } from '@/components/ui/LoadingFallback'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CompareProvider } from '@/components/CompareProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bayara - UAE Real Estate Marketplace',
  description:
    'Find your next home in the UAE. Apartments, villas and townhouses across Dubai, Abu Dhabi and Sharjah — verified listings, transparent pricing, direct-to-agent.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  keywords: [
    'UAE real estate',
    'Dubai properties',
    'Abu Dhabi homes',
    'Sharjah apartments',
    'buy property UAE',
    'rent UAE',
    'RERA certified',
  ],
  authors: [{ name: 'Bayara Real Estate' }],
  icons: {
    icon: '/bayara_icon_mark.png',
    apple: '/bayara_icon_mark.png',
  },
  openGraph: {
    title: 'Bayara - UAE Real Estate Marketplace',
    description:
      'Find your next home in the UAE. Verified listings, transparent pricing, direct-to-agent.',
    type: 'website',
    locale: 'en_AE',
    images: [
      {
        url: '/bayara_primary_logo_horizontal.png',
        alt: 'Bayara',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bayara - UAE Real Estate Marketplace',
    description:
      'Find your next home in the UAE. Verified listings, transparent pricing, direct-to-agent.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
    languages: {
      ar: '/ar',
      en: '/en',
    },
  },
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const messages = await getMessages({ locale })

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className='h-full' suppressHydrationWarning>
      <body
        className={cn(
          'min-h-full flex flex-col antialiased font-sans',
          inter.variable,
          notoKufiArabic.variable,
          locale === 'ar' && 'font-(--font-arabic)'
        )}
      >
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <CompareProvider>
            <NextIntlClientProvider messages={messages}>
              <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
            </NextIntlClientProvider>
          </CompareProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
