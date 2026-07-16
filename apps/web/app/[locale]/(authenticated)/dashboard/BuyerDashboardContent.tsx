'use client'

import { Bell, CreditCard, Heart, Inbox } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PropertyCard } from '@/components/properties/PropertCard'
import { Link } from '@/i18n/navigation'
import type { PaymentDTO, PropertyDTO } from '@repo/types'
import { useFavoriteProperties } from '@/hooks/useFavorites'

interface SavedSearch {
  id: string
  name: string
  alertsOn: boolean
}

interface UserInquiry {
  id: string
  property: {
    title: string
  }
  status: 'NEW' | 'CONTACTED' | 'CLOSED'
  createdAt: string
}

interface BuyerDashboardContentProps {
  userName: string
  favorites: PropertyDTO[]
  savedSearches: SavedSearch[]
  inquiries: UserInquiry[]
  reservations: PaymentDTO[]
  defaultTab?: 'favorites' | 'searches' | 'inquiries' | 'reservations'
}

export function BuyerDashboardContent({
  userName,
  favorites,
  savedSearches,
  inquiries,
  reservations,
  defaultTab = 'favorites',
}: BuyerDashboardContentProps) {
  const t = useTranslations('dashboard')
  const format = useFormatter()
  const { favorites: favoriteItems, handleFavoriteToggle } = useFavoriteProperties(favorites)

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='mx-auto max-w-7xl px-4 py-10'>
        <h1 className='text-2xl font-bold'>{t('greeting', { name: userName })}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>

        <Tabs defaultValue={defaultTab} className='mt-8'>
          <TabsList>
            <TabsTrigger value='favorites'>
              <Heart className='h-4 w-4' /> {t('favorites')}
            </TabsTrigger>
            <TabsTrigger value='searches'>
              <Bell className='h-4 w-4' /> {t('savedSearches')}
            </TabsTrigger>
            <TabsTrigger value='reservations'>
              <CreditCard className='h-4 w-4' /> {t('reservations')}
            </TabsTrigger>
            <TabsTrigger value='inquiries'>
              <Inbox className='h-4 w-4' /> {t('inquiries')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='favorites' className='mt-6'>
            {favoriteItems.length === 0 ? (
              <div className='py-12 text-center'>
                <Heart className='mx-auto h-12 w-12 text-muted-foreground' />
                <h3 className='mt-4 font-semibold'>{t('noFavorites')}</h3>
                <p className='mt-2 text-sm text-muted-foreground'>{t('noFavoritesDescription')}</p>
                <Button className='mt-4' render={<Link href='/buy' />}>
                  {t('browseProperties')}
                </Button>
              </div>
            ) : (
              <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                {favoriteItems.map(property => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFavorite
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='searches' className='mt-6 space-y-3'>
            {savedSearches.length === 0 ? (
              <div className='py-12 text-center'>
                <Bell className='mx-auto h-12 w-12 text-muted-foreground' />
                <h3 className='mt-4 font-semibold'>{t('noSavedSearches')}</h3>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {t('noSavedSearchesDescription')}
                </p>
                <Button className='mt-4' render={<Link href='/buy' />}>
                  {t('browseProperties')}
                </Button>
              </div>
            ) : (
              savedSearches.map(search => (
                <div
                  key={search.id}
                  className='flex items-center justify-between rounded-xl border bg-card p-4 shadow-card'
                >
                  <div>
                    <div className='font-medium'>{search.name}</div>
                    <div className='text-xs text-muted-foreground'>{t('emailAlert')}</div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Switch defaultChecked={search.alertsOn} />
                    <Button variant='outline' size='sm'>
                      {t('edit')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value='reservations' className='mt-6 space-y-3'>
            {reservations.length === 0 ? (
              <div className='py-12 text-center'>
                <CreditCard className='mx-auto h-12 w-12 text-muted-foreground' />
                <h3 className='mt-4 font-semibold'>{t('noReservations')}</h3>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {t('noReservationsDescription')}
                </p>
                <Button className='mt-4' render={<Link href='/buy' />}>
                  {t('browseProperties')}
                </Button>
              </div>
            ) : (
              reservations.map(payment => {
                const reservationTitle =
                  typeof payment.metadata?.propertyTitle === 'string'
                    ? payment.metadata.propertyTitle
                    : t('reservationUnknownProperty')

                return (
                  <div key={payment.id} className='rounded-xl border bg-card p-4 shadow-card'>
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                      <div>
                        <div className='text-lg font-semibold'>{reservationTitle}</div>
                        <div className='text-sm text-muted-foreground'>
                          {t('reservationAmount')}: AED {payment.amountAed}
                        </div>
                      </div>
                    <div className='inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs'>
                      <span>{t('reservationStatus')}</span>
                      <span className='font-semibold'>{payment.status}</span>
                    </div>
                  </div>
                    <div className='mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
                      <span>
                        {t('reservationProvider')}: {payment.provider}
                      </span>
                      <span>
                        {t('reservationDate')}:{' '}
                        {format.dateTime(new Date(payment.createdAt), { dateStyle: 'medium' })}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>

          <TabsContent value='inquiries' className='mt-6 space-y-3'>
            {inquiries.length === 0 ? (
              <div className='py-12 text-center'>
                <Inbox className='mx-auto h-12 w-12 text-muted-foreground' />
                <h3 className='mt-4 font-semibold'>{t('noInquiries')}</h3>
                <p className='mt-2 text-sm text-muted-foreground'>{t('noInquiriesDescription')}</p>
                <Button className='mt-4' render={<Link href='/buy' />}>
                  {t('browseProperties')}
                </Button>
              </div>
            ) : (
              inquiries.map(inquiry => (
                <div
                  key={inquiry.id}
                  className='flex items-center justify-between rounded-xl border bg-card p-4 shadow-card'
                >
                  <div>
                    <div className='font-medium'>{inquiry.property.title}</div>
                    <div className='text-xs text-muted-foreground'>
                      {t('sent', {
                        date: format.dateTime(new Date(inquiry.createdAt), { dateStyle: 'medium' }),
                      })}
                    </div>
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {inquiry.status === 'CONTACTED' ? t('contacted') : t('new')}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
