'use client'

import { XCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function PaymentCancelClient() {
  const t = useTranslations('payment')

  return (
    <div className='min-h-screen bg-muted/30 flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        <div className='mb-6 flex justify-center'>
          <BrandLogo variant='stacked' className='h-12' />
        </div>
        <Card className='p-8 text-center shadow-elegant'>
          <div className='mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center'>
            <XCircle className='h-8 w-8 text-red-600' />
          </div>
          <h1 className='mt-4 text-2xl font-bold'>{t('canceled')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('canceledDescription')}</p>
          <div className='mt-6 space-y-3'>
            <Button className='w-full' variant='default' render={<Link href='/buy' />}>
              {t('backToListings')}
            </Button>
            <Button className='w-full' variant='outline' render={<Link href='/dashboard' />}>
              <Home className='me-2 h-4 w-4' />
              {t('goToDashboard')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
