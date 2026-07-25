import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { AnimatedHero } from '@/components/AnimatedHero'
import { AnimatedHowItWorks } from '@/components/AnimatedHowItWorks'
import { AnimatedAgentCta } from '@/components/AnimatedAgentCta'
import FeaturedProperties from '@/components/properties/FeaturedProperties'
import { PropertyCardSkeleton } from '@/components/properties/PropertCard'
import { Link } from '@/i18n/navigation'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('home')

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE',
      images: [
        {
          url: '/bayara_primary_logo_horizontal.png',
          alt: 'Bayara',
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: '/ar',
        en: '/en',
      },
    },
  }
}

const Home = async () => {
  const t = await getTranslations('home')

  return (
    <div className='min-h-screen'>
      <AnimatedHero />

      <section className='mx-auto max-w-7xl px-4 py-16'>
        <div className='mb-8 flex items-end justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold md:text-3xl'>{t('featured')}</h2>
            <p className='mt-1 text-sm text-muted-foreground'>{t('featuredDescription')}</p>
          </div>
          <Button
            variant='ghost'
            className='hidden md:inline-flex items-center gap-1'
            render={<Link href='/properties' />}
          >
            {t('viewAll')} <ArrowLeft className='h-4 w-4 ltr:rotate-180' />
          </Button>
        </div>
        <Suspense fallback={<FeaturedPropertiesSkeleton />}>
          <FeaturedProperties />
        </Suspense>
      </section>

      <section className='bg-muted/40 py-16'>
        <div className='mx-auto max-w-7xl px-4'>
          <h2 className='text-2xl font-bold md:text-3xl'>{t('communities')}</h2>
          <p className='mt-1 text-sm text-muted-foreground'>{t('communitiesDescription')}</p>
          {/* <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {popularCommunities.map(c => (
              <Link
                key={c.name}
                href='/properties'
                search={{ q: c.name } as never}
                className='group relative aspect-[4/3] overflow-hidden rounded-xl bg-card shadow-card'
              >
                <img
                  src={c.image}
                  alt={c.name}
                  loading='lazy'
                  className='h-full w-full object-cover transition duration-500 group-hover:scale-110'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
                <div className='absolute bottom-0 p-4 text-white'>
                  <div className='font-semibold'>{c.name}</div>
                  <div className='text-xs text-white/80'>{c.count.toLocaleString()} properties</div>
                </div>
              </Link>
            ))}
          </div> */}
        </div>
      </section>

      <AnimatedHowItWorks />

      <AnimatedAgentCta />
    </div>
  )
}

function FeaturedPropertiesSkeleton() {
  return (
    <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default Home
