import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getAgent } from '@/lib/api/agents'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PropertyCard } from '@/components/properties/PropertCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Phone, Mail, Building2, Languages, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const agent = await getAgent(id)
  const t = await getTranslations('agent')

  if (!agent) {
    return {
      title: t('notFound'),
    }
  }

  const title = `${agent.user.firstName} ${agent.user.lastName} - ${t('title')}`
  const description = agent.bio || t('defaultDescription')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE',
      images: agent.user.avatarUrl ? [
        {
          url: agent.user.avatarUrl,
          alt: `${agent.user.firstName} ${agent.user.lastName}`,
          width: 400,
          height: 400,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `/${locale}/agents/${id}`,
      languages: {
        ar: `/ar/agents/${id}`,
        en: `/en/agents/${id}`,
      },
    },
  }
}

export default async function AgentProfilePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  setRequestLocale(locale)

  const agent = await getAgent(id)

  if (!agent) {
    notFound()
  }

  const t = await getTranslations('agent')

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='mx-auto max-w-7xl px-4 py-10'>
        {/* Agent Header Card */}
        <Card className='mb-8 p-6 shadow-elegant'>
          <div className='flex flex-col gap-6 md:flex-row md:items-start'>
            {/* Profile Photo */}
            <div className='flex-shrink-0'>
              <div className='relative h-32 w-32 overflow-hidden rounded-full bg-muted'>
                {agent.user.avatarUrl ? (
                  <Image
                    src={agent.user.avatarUrl}
                    alt={`${agent.user.firstName} ${agent.user.lastName}`}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-primary/10 text-primary text-3xl font-bold'>
                    {agent.user.firstName[0]}{agent.user.lastName[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Agent Info */}
            <div className='flex-1'>
              <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
                <div>
                  <h1 className='text-2xl font-bold md:text-3xl'>
                    {agent.user.firstName} {agent.user.lastName}
                  </h1>
                  {agent.agency && (
                    <div className='mt-2 flex items-center gap-2 text-muted-foreground'>
                      <Building2 className='h-4 w-4' />
                      <span className='font-medium'>{agent.agency.name}</span>
                      {agent.agency.logoUrl && (
                        <Image
                          src={agent.agency.logoUrl}
                          alt={agent.agency.name}
                          width={24}
                          height={24}
                          className='rounded'
                        />
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant='default'
                  size='lg'
                  render={<Link href={`/properties?agent=${agent.id}`} />}
                >
                  {t('viewListings')}
                </Button>
              </div>

              {/* Badges and Info */}
              <div className='mt-4 flex flex-wrap gap-3'>
                {agent.licenseNo && (
                  <Badge variant='secondary' className='flex items-center gap-1'>
                    <ShieldCheck className='h-3 w-3' />
                    {t('license')}: {agent.licenseNo}
                  </Badge>
                )}
                {agent.languages.length > 0 && (
                  <Badge variant='outline' className='flex items-center gap-1'>
                    <Languages className='h-3 w-3' />
                    {agent.languages.join(', ')}
                  </Badge>
                )}
              </div>

              {/* Bio */}
              {agent.bio && (
                <p className='mt-4 text-muted-foreground leading-relaxed'>
                  {agent.bio}
                </p>
              )}

              {/* Contact Info */}
              <div className='mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground'>
                {agent.user.phone && (
                  <div className='flex items-center gap-2'>
                    <Phone className='h-4 w-4' />
                    <span>{agent.user.phone}</span>
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  <span>{agent.user.email}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Listings */}
        <div>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>{t('activeListings')}</h2>
            <p className='text-sm text-muted-foreground'>
              {agent.properties.length} {t('properties')}
            </p>
          </div>

          {agent.properties.length === 0 ? (
            <Card className='p-12 text-center'>
              <Building2 className='mx-auto h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 font-semibold'>{t('noListings')}</h3>
              <p className='mt-2 text-sm text-muted-foreground'>{t('noListingsDescription')}</p>
            </Card>
          ) : (
            <Suspense fallback={<PropertiesGridSkeleton />}>
              <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                {agent.properties.map(property => (
                  <PropertyCard
                    key={property.id}
                    property={{
                      id: property.id,
                      title: property.title,
                      slug: property.slug,
                      description: '',
                      price: property.price,
                      listingType: property.type as any,
                      propertyType: property.type as any,
                      status: property.status as any,
                      bedrooms: property.bedrooms,
                      bathrooms: property.bathrooms,
                      areaSqft: property.areaSqft,
                      images: property.images,
                      community: {
                        name: property.location,
                        emirate: property.location,
                      } as any,
                      rentFrequency: 'monthly' as any,
                      createdAt: new Date().toISOString(),
                    }}
                  />
                ))}
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}

function PropertiesGridSkeleton() {
  return (
    <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className='aspect-[4/3] animate-pulse' />
      ))}
    </div>
  )
}