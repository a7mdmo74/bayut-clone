'use client'

import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useEffect, useState } from 'react'
import { getPaymentById } from '@/lib/api/payments-client'
import type { PaymentDTO } from '@repo/types'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'

interface PaymentSuccessClientProps {
  payment: PaymentDTO | null
  isLoading: boolean
}

export function PaymentSuccessClient({
  payment: initialPayment,
  isLoading: initialLoading,
}: PaymentSuccessClientProps) {
  const t = useTranslations('payment')
  const router = useRouter()
  const [payment, setPayment] = useState<PaymentDTO | null>(initialPayment)
  const [isLoading, setIsLoading] = useState(initialLoading)

  useEffect(() => {
    if (!initialPayment?.id || initialPayment.status === 'CAPTURED') return

    const pollInterval = setInterval(async () => {
      try {
        const updatedPayment = await getPaymentById(initialPayment.id)
        if (updatedPayment) {
          setPayment(updatedPayment)
          if (updatedPayment.status === 'CAPTURED') {
            setIsLoading(false)
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }, 2000)

    const timeout = setTimeout(() => clearInterval(pollInterval), 30000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [initialPayment])

  useEffect(() => {
    if (!payment || payment.status !== 'CAPTURED') return

    const target = payment.purpose === 'PROPERTY_RESERVATION' ? '/dashboard' : '/agent/billing'
    router.push(target)
  }, [payment, router])

  const isBuyerReservation = payment?.purpose === 'PROPERTY_RESERVATION'
  const continueHref = isBuyerReservation ? '/dashboard' : '/agent/billing'
  const continueLabel = isBuyerReservation ? t('goToDashboard') : t('goToBilling')

  return (
    <div className='min-h-screen bg-muted/30 flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        <div className='mb-6 flex justify-center'>
          <BrandLogo variant='stacked' className='h-12' />
        </div>
        {isLoading ? (
          <Card className='p-8 text-center'>
            <Loader2 className='mx-auto h-16 w-16 animate-spin text-primary' />
            <h1 className='mt-4 text-2xl font-bold'>{t('processing')}</h1>
            <p className='mt-2 text-sm text-muted-foreground'>{t('processingDescription')}</p>
          </Card>
        ) : payment?.status === 'CAPTURED' ? (
          <Card className='p-8 text-center'>
            <CheckCircle className='mx-auto h-16 w-16 text-green-500' />
            <h1 className='mt-4 text-2xl font-bold'>{t('success')}</h1>
            <p className='mt-2 text-sm text-muted-foreground'>{t('successDescription')}</p>
            <div className='mt-6 rounded-lg bg-muted p-4 text-left'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>{t('amount')}</span>
                <span className='font-medium'>AED {payment.amountAed}</span>
              </div>
              <div className='mt-2 flex justify-between text-sm'>
                <span className='text-muted-foreground'>{t('provider')}</span>
                <span className='font-medium'>{payment.provider}</span>
              </div>
              <div className='mt-2 flex justify-between text-sm'>
                <span className='text-muted-foreground'>{t('purpose')}</span>
                <span className='font-medium'>{payment.purpose.replaceAll('_', ' ')}</span>
              </div>
            </div>
            <Button className='mt-6 w-full' render={<Link href={continueHref} />}>
              {continueLabel}
            </Button>
          </Card>
        ) : (
          <Card className='p-8 text-center'>
            <div className='mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-yellow-600' />
            </div>
            <h1 className='mt-4 text-2xl font-bold'>{t('pending')}</h1>
            <p className='mt-2 text-sm text-muted-foreground'>{t('pendingDescription')}</p>
            <Button onClick={() => window.location.reload()} className='mt-6 w-full'>
              {t('refresh')}
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
