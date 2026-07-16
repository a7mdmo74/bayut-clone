import { ArrowLeft, BadgeCheck, Building2, Search, ShieldCheck, Users } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { HeroSearch } from '@/components/HeroSearch'
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
      <section className='relative overflow-hidden bg-gradient-hero text-white'>
        <div className='absolute inset-0 opacity-25'>
          <Image
            src='/hero_buyer.jpeg'
            alt='Dubai Skyline'
            fill
            className='object-cover bg-fixed'
            priority
            sizes='100vw'
          />
        </div>
        <div className='relative mx-auto max-w-7xl px-4 py-20 md:py-32'>
          <div className='max-w-2xl'>
            <BrandLogo variant='reversed' className='mb-4 h-8' priority />
            <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur'>
              <BadgeCheck className='h-3.5 w-3.5' /> {t('trusted')}
            </div>
            <h1 className='text-4xl font-bold tracking-tight md:text-6xl'>{t('title')}</h1>
            <p className='mt-4 text-lg text-white/85'>{t('description')}</p>
          </div>
          <div className='mt-8'>
            <HeroSearch />
          </div>
          <div className='mt-8 flex flex-wrap gap-6 text-sm text-white/80'>
            <div className='flex items-center gap-2'>
              <Building2 className='h-4 w-4' /> {t('listings')}
            </div>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4' /> {t('agents')}
            </div>
            <div className='flex items-center gap-2'>
              <ShieldCheck className='h-4 w-4' /> {t('verified')}
            </div>
          </div>
        </div>
      </section>

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

      <section className='mx-auto max-w-7xl px-4 py-16'>
        <h2 className='text-center text-2xl font-bold md:text-3xl'>{t('how')}</h2>
        <div className='mt-10 grid gap-6 md:grid-cols-3'>
          {[
            {
              icon: <Search className='h-5 w-5' />,
              title: t('steps.searchTitle'),
              body: t('steps.searchBody'),
            },
            {
              icon: <Users className='h-5 w-5' />,
              title: t('steps.agentTitle'),
              body: t('steps.agentBody'),
            },
            {
              icon: <BadgeCheck className='h-5 w-5' />,
              title: t('steps.moveTitle'),
              body: t('steps.moveBody'),
            },
          ].map((s, i) => (
            <div key={i} className='rounded-2xl border bg-card p-6 shadow-card'>
              <div className='grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary'>
                {s.icon}
              </div>
              <div className='mt-4 font-semibold'>
                {i + 1}. {s.title}
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='mx-auto mb-16 max-w-7xl px-4'>
        <div className='overflow-hidden rounded-2xl bg-gradient-primary p-8 text-primary-foreground md:p-12'>
          <div className='grid gap-8 md:grid-cols-[1.6fr_1fr] md:items-center'>
            <div>
              <h3 className='text-2xl font-bold md:text-3xl'>{t('agentTitle')}</h3>
              <p className='mt-2 text-primary-foreground/85'>{t('agentDescription')}</p>
            </div>
            <div className='flex flex-wrap gap-3 md:justify-end'>
              <Button size='lg' variant='secondary' render={<Link href='/become-agent' />}>
                {t('becomeAgent')}
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-white/40 bg-white/10 text-white hover:bg-white/20'
                render={<Link href='/agent/dashboard' />}
              >
                {t('agentLogin')}
              </Button>
            </div>
          </div>
        </div>
      </section>
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
