'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ViewingStatusBadge } from './ViewingStatusBadge'
import { cancelViewing } from '@/lib/api/viewings'
import type { ViewingDTO } from '@repo/types'

interface ViewingsListProps {
  initialViewings: ViewingDTO[]
}

export default function ViewingsList({ initialViewings }: ViewingsListProps) {
  const [viewings, setViewings] = useState(initialViewings)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null)
  const t = useTranslations('viewing')
  const dashboardT = useTranslations('dashboard')
  const locale = useLocale()

  async function handleCancel(viewingId: string) {
    setCancellingId(viewingId)
    try {
      await cancelViewing(viewingId)
      setViewings(prev =>
        prev.map(v =>
          v.id === viewingId ? { ...v, status: 'CANCELED_BY_BUYER' as const } : v
        )
      )
      setShowCancelDialog(null)
    } catch (error) {
      console.error('Failed to cancel viewing:', error)
    } finally {
      setCancellingId(null)
    }
  }

  function canCancel(viewing: ViewingDTO): boolean {
    return viewing.status === 'CONFIRMED' || viewing.status === 'REQUESTED'
  }

  if (viewings.length === 0) {
    return (
      <Card className='p-8 text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
          <svg
            className='h-8 w-8 text-muted-foreground'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
        </div>
        <h3 className='mb-2 text-lg font-semibold text-foreground'>{dashboardT('noViewings')}</h3>
        <p className='mb-4 text-sm text-muted-foreground'>{dashboardT('noViewingsDescription')}</p>
        <Button variant='default' render={<Link href='/properties' />}>
          {dashboardT('browseProperties')}
        </Button>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {viewings.map(viewing => {
        const showCancel = canCancel(viewing)

        return (
          <Card key={viewing.id} className='p-4'>
            <div className='flex gap-4'>
              <div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted'>
                {viewing.property?.images[0] ? (
                  <Image
                    src={viewing.property.images[0]}
                    alt={viewing.property.title}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                    <svg className='h-8 w-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className='min-w-0 flex-1'>
                {viewing.property ? (
                  <Link
                    href={`/properties/${viewing.property.slug}`}
                    className='font-medium text-foreground transition hover:text-primary'
                  >
                    {viewing.property.title}
                  </Link>
                ) : (
                  <span className='font-medium text-muted-foreground'>Property not available</span>
                )}

                <div className='mt-1 text-sm text-muted-foreground'>
                  {viewing.property?.community
                    ? `${viewing.property.community.name}, ${viewing.property.community.emirate}`
                    : 'Location not available'}
                </div>

                <div className='mt-2 flex flex-wrap items-center gap-2 text-sm'>
                  <div className='text-muted-foreground'>
                    {new Date(viewing.scheduledAt).toLocaleDateString(
                      locale === 'ar' ? 'ar-AE' : 'en-AE',
                      { dateStyle: 'medium' }
                    )}{' '}
                    at{' '}
                    {new Date(viewing.scheduledAt).toLocaleTimeString(
                      locale === 'ar' ? 'ar-AE' : 'en-AE',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </div>
                  <ViewingStatusBadge status={viewing.status} />
                </div>
              </div>

              <div className='flex-shrink-0'>
                {showCancel && (
                  <>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setShowCancelDialog(viewing.id)}
                      disabled={cancellingId === viewing.id}
                    >
                      {cancellingId === viewing.id ? t('processing') : t('cancel')}
                    </Button>

                    {showCancelDialog === viewing.id && (
                      <div className='mt-2 rounded-lg bg-muted p-3 text-sm'>
                        <p className='mb-3 font-medium text-foreground'>{t('cancelConfirm')}</p>
                        <div className='flex gap-2'>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleCancel(viewing.id)}
                            disabled={cancellingId === viewing.id}
                          >
                            {cancellingId === viewing.id ? t('processing') : t('cancel')}
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setShowCancelDialog(null)}
                          >
                            {t('keepBooking')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
